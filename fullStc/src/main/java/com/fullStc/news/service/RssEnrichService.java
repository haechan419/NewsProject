package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Service;
import com.fullStc.news.domain.News;
import com.fullStc.news.extract.ExtractorRegistry;
import com.fullStc.news.repository.NewsRepository;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RssEnrichService {

    private final NewsRepository newsRepository;
    private final ExtractorRegistry registry;
    private final NewsEnrichStoreService enrichStore;

    // ★ 수동/스케줄러 실행용
    public void enrich(int limit) {
        // RSS 중 본문 없는 애들 가져오기 (Lock 걸어서)
        var targets = newsRepository.findRssWithoutContent(limit);
        runEnrichment(targets);
    }

    // ★ 파이프라인(크롤링 직후) 실행용
    public void enrichForIds(List<Long> ids) {
        if (ids.isEmpty()) return;
        // RSS 뉴스만 골라서 가져오기
        var targets = newsRepository.findByIdIn(ids).stream()
                .filter(n -> "rss".equals(n.getProvider()))
                .toList();

        runEnrichment(targets);
    }

    private void runEnrichment(List<News> targets) {
        Instant now = Instant.now();

        for (News n : targets) {
            enrichStore.markAttempt(n.getId(), now); // 시도 체크

            try {
                String googleUrl = n.getUrl();

                // 1. [핵심] 구글 리다이렉트 뚫고 "진짜 주소" 알아내기
                String realUrl = resolveRealUrl(googleUrl);

                // 2. 진짜 주소로 본문 추출
                var r = registry.extract(realUrl);

                // 3. 검증
                int len = (r == null || r.content() == null) ? 0 : r.content().trim().length();
                if (r == null || !r.ok() || len < 50) {
                    log.warn("[RSS FAIL] Content empty. ID={} URL={}", n.getId(), realUrl);
                    continue;
                }

                // 4. 저장 (JDBC 사용)
                enrichStore.saveContent(n.getId(), r.content(), now);
                log.info("[RSS OK] ID={} RealUrl={}", n.getId(), realUrl);

            } catch (Exception e) {
                log.error("[RSS ERROR] ID={} Msg={}", n.getId(), e.getMessage());
            }
        }
    }

    // 구글 단축 URL -> 진짜 언론사 URL로 변환하는 메소드
    private String resolveRealUrl(String url) {
        try {
            // Jsoup으로 헤더만 요청해서 최종 URL 확인 (빠름)
            return Jsoup.connect(url)
                    .followRedirects(true)
                    .execute()
                    .url()
                    .toString();
        } catch (Exception e) {
            // 실패하면 그냥 원래 URL 반환 (어차피 밑에서 에러 나겠지만)
            return url;
        }
    }
}