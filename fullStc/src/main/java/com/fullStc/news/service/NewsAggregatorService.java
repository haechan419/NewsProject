package com.fullStc.news.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.fullStc.news.domain.News;
import com.fullStc.news.dto.NewsResponse;
import com.fullStc.news.dto.UnifiedArticle;
import com.fullStc.news.provider.NewsProvider;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsAggregatorService {

    private final List<NewsProvider> providers;
    private final NewsStoreService storeService;

    // Orchestrator 제거됨 (순환 참조 해결 완료) ✅

    @Value("${news.cacheTtlSeconds:60}")
    private long ttlSeconds;

    private ExecutorService pool;
    private Cache<String, List<UnifiedArticle>> cache;

    @PostConstruct
    void init() {
        this.pool = Executors.newFixedThreadPool(Math.max(4, providers.size()));
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(ttlSeconds, TimeUnit.SECONDS)
                .maximumSize(500)
                .build();
    }

    @PreDestroy
    void shutdown() {
        if (pool != null) {
            pool.shutdown();
            try {
                if (!pool.awaitTermination(60, TimeUnit.SECONDS)) {
                    pool.shutdownNow();
                }
            } catch (InterruptedException e) {
                pool.shutdownNow();
            }
        }
    }

    public List<UnifiedArticle> getNews(String category, String query, int size) {
        // ... (기존 로직 유지: 캐시 조회, 병합, 정렬 등) ...
        String cacheKey = category + "|" + query + "|" + size;
        List<UnifiedArticle> cached = cache.getIfPresent(cacheKey);
        if (cached != null) return cached;

        Map<String, NewsProvider> map = providers.stream()
                .collect(Collectors.toMap(NewsProvider::name, p -> p, (a, b) -> a));

        NewsProvider naver = map.get("naver");
        NewsProvider rss = map.get("rss");

        List<UnifiedArticle> merged = new ArrayList<>();

        if (naver != null) {
            merged.addAll(safeFetch(naver, category, query, size));
        }

        if (merged.size() < size && rss != null) {
            merged.addAll(safeFetch(rss, category, query, size - merged.size()));
        }

        List<UnifiedArticle> result = mergeDedupeSort(merged, size);
        cache.put(cacheKey, result);
        return result;
    }

    // safeFetch, mergeDedupeSort, dedupeKey, canonicalizeUrl, pickBetter 등은
    // 기존 코드 그대로 두시면 됩니다. (생략함)
    private List<UnifiedArticle> safeFetch(NewsProvider p, String category, String query, int size) {
        try {
            List<UnifiedArticle> r = p.fetch(category, query, size);
            log.info("[NEWS] provider={} count={}", p.name(), r.size());
            return r;
        } catch (Exception e) {
            log.error("[NEWS] provider={} FAILED: {}", p.name(), e.getMessage());
            return List.of();
        }
    }

    private List<UnifiedArticle> mergeDedupeSort(List<UnifiedArticle> items, int size) {
        Map<String, UnifiedArticle> map = new LinkedHashMap<>();
        for (UnifiedArticle a : items) {
            String key = dedupeKey(a);
            UnifiedArticle prev = map.get(key);
            if (prev == null) map.put(key, a);
            else map.put(key, pickBetter(prev, a));
        }
        return map.values().stream()
                .sorted(Comparator.comparing(UnifiedArticle::getPublishedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(size)
                .toList();
    }

    private String dedupeKey(UnifiedArticle a) {
        String url = (a.getUrl() == null) ? "" : a.getUrl().trim();
        if (!url.isBlank()) return "U:" + canonicalizeUrl(url);
        String title = (a.getTitle() == null) ? "" : a.getTitle().toLowerCase(Locale.ROOT).replaceAll("[\\s\\p{Punct}]+", "");
        long day = (a.getPublishedAt() == null ? Instant.EPOCH : a.getPublishedAt()).getEpochSecond() / 86400;
        return "T:" + title + ":" + day;
    }
    private String canonicalizeUrl(String url) {
        String u = url;
        int hash = u.indexOf('#');
        if (hash >= 0) u = u.substring(0, hash);
        return u;
    }
    private UnifiedArticle pickBetter(UnifiedArticle a, UnifiedArticle b) {
        int alen = (a.getSummary() == null) ? 0 : a.getSummary().length();
        int blen = (b.getSummary() == null) ? 0 : b.getSummary().length();
        if (blen > alen) return b;
        if (b.getPublishedAt() != null && a.getPublishedAt() != null && b.getPublishedAt().isAfter(a.getPublishedAt())) return b;
        return a;
    }


    /**
     * ★ 수정됨: 리턴 타입을 NewsResponse로 변경
     * - Controller는 여기서 받은 NewsResponse를 그대로 사용자에게 JSON으로 주고,
     * - Controller(또는 Scheduler)는 NewsResponse 안에 숨겨진 insertedIds를 꺼내서 파이프라인에 넣음.
     */
    public NewsResponse fetchAndSave(String category, String query, int size) {
        // 1. 뉴스 긁어오기
        List<UnifiedArticle> all = getNews(category, query, size);
        Instant now = Instant.now();

        List<Long> insertedIds = new ArrayList<>();

        // 2. 저장 (Insert 된 것만 골라내기)
        for (UnifiedArticle it : all) {
            News entity = News.builder()
                    .sourceId(it.getId())
                    .title(it.getTitle())
                    .summary(it.getSummary())
                    .url(it.getUrl())
                    .sourceName(it.getSourceName())
                    .provider(it.getProvider())
                    .category(it.getCategory())
                    .publishedAt(it.getPublishedAt())
                    .fetchedAt(now)
                    .build();

            var r = storeService.upsertReturningInsert(entity);
            if (r.inserted()) {
                insertedIds.add(r.id());
            }
        }

        log.info("[AGGREGATOR] Saved {} new items (Total fetched: {})", insertedIds.size(), all.size());

        // 3. ★ 리턴값 포장 (뉴스 목록 + 새로 저장된 ID 목록)
        return NewsResponse.builder()
                .category(category)
                .query(query == null ? "" : query)
                .items(all)
                .insertedIds(insertedIds) // DTO에 @JsonIgnore 된 필드에 넣음
                .build();
    }
}