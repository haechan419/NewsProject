
package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fullStc.news.domain.News;
import com.fullStc.news.repository.NewsRepository;
import com.fullStc.news.utils.GoogleNewsPublisherResolver;

import java.net.URI;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NewsQualityService {

    private final NewsRepository newsRepository;

    private final VectorCodec vectorCodec;
    private final EvidenceMatcher evidenceMatcher;
    private final QualityScorer qualityScorer;

    private final NewsClusterStoreService clusterStore;
    private final NewsQualityStoreService qualityStore;
    private final EvidenceStoreService evidenceStore;

    // ✅ google_rss 링크를 publisher(언론사) URL로 풀어서 "도메인 다양성" 교차검증에 사용
    private final GoogleNewsPublisherResolver googlePublisherResolver;

    // 튜닝 파라미터
    private final int candidateHours = 48;
    private final int candidateLimit = 800;
    private final int topK = 20;
    private final double dupThreshold = 0.60;

    // 교차검증(구글RSS) 설정
    private final double crossTitleThreshold = 0.45; // 제목 토큰 유사도 컷
    private final double crossMaxBoost = 0.50;       // 최대 가산점(0~1 스케일 기준)

    @Transactional
    public void runQualityPipeline(int limit) {
        List<News> targets = newsRepository.findTopForQuality(limit);
        if (targets.isEmpty()) return;

        Instant now = Instant.now();

        // clusterId -> (clusterKey, items)
        Map<Long, ClusterBucket> buckets = new LinkedHashMap<>();

        // 1) 타겟을 클러스터에 할당 (clusterKey는 "처음 계산한 값"을 끝까지 사용)
        for (News n : targets) {
            if (n.getEmbedding() == null) continue;

            float[] q = vectorCodec.fromJson(n.getEmbedding());
            List<ScoredNews> candidates = findTopKCandidates(n, q);

            String clusterKey = computeClusterKey(n, candidates);

            long clusterId = clusterStore.upsertCluster(
                    clusterKey,
                    n.getCategory(),
                    n.getId(),
                    bestTitle(n, candidates),
                    null,
                    "[]",
                    null
            );

            n.setDupClusterId(clusterId);

            buckets.computeIfAbsent(clusterId, id -> new ClusterBucket(clusterKey))
                    .items.add(n);
        }

        // 2) 클러스터 단위 점수/flags/badge 산정 + evidence 저장 + news 업데이트 payload 생성
        List<NewsQualityStoreService.QualityUpdate> updates = new ArrayList<>();

        for (var entry : buckets.entrySet()) {
            long clusterId = entry.getKey();
            ClusterBucket bucket = entry.getValue();
            List<News> items = bucket.items;
            if (items.isEmpty()) continue;

            // ✅ base score는 기존 scorer 그대로(0~1 스케일 가정)
            QualityScorer.Result qr = qualityScorer.scoreCluster(items);

            long repId = pickRepresentative(items);
            String repTitle = items.get(0).getTitle();
            String category = items.get(0).getCategory();

            // ✅ 같은 clusterKey로 업데이트해야 함
            String flagsJson = normalizeFlags(qr.flagsJson());

            // 클러스터 테이블에는 base score만(또는 final로 바꿔도 되지만 최소수정)
            clusterStore.upsertCluster(
                    bucket.clusterKey,
                    category,
                    repId,
                    repTitle,
                    qr.score(),
                    flagsJson,
                    qr.badge()
            );

            // ✅ 교차검증 evidence: 동일 cluster 내 google_rss 후보들을 사용
            // - 네이버 기사(원문)만 교차검증 점수 가산
            List<News> googleItems = items.stream()
                    .filter(n -> "google_rss".equalsIgnoreCase(n.getProvider()))
                    .toList();

            for (News n : items) {
                // (A) 기존 evidence: aiSummary 문장 ↔ 자기 content 근거
                evidenceStore.deleteByNewsId(n.getId());
                evidenceStore.batchInsert(buildEvidenceRows(n));

                // (B) 교차검증 점수
                double crossBoost = 0.0;
                if ("naver".equalsIgnoreCase(n.getProvider())) {
                    crossBoost = computeCrossBoost(n, googleItems);
                }

                double finalScore01 = clamp01(qr.score() + crossBoost);
                int finalScore100 = (int) Math.round(finalScore01 * 100.0);

                updates.add(new NewsQualityStoreService.QualityUpdate(
                        n.getId(),
                        clusterId,
                        finalScore100,   // ✅ 엔티티 스펙(0~100)
                        flagsJson,       // ✅ JSON 배열 문자열
                        qr.badge(),
                        now
                ));

                if (crossBoost > 0) {
                    System.out.println("[QUALITY] cross-verified newsId=" + n.getId()
                            + " crossBoost=" + String.format(Locale.ROOT, "%.3f", crossBoost)
                            + " base=" + String.format(Locale.ROOT, "%.3f", qr.score())
                            + " final=" + String.format(Locale.ROOT, "%.3f", finalScore01)
                            + " score100=" + finalScore100);
                }
            }
        }

        // 3) news 벌크 업데이트
        qualityStore.batchUpdateQuality(updates);
    }

    /**
     * ✅ 교차검증 가산점 계산 (최소 침습)
     * - 같은 클러스터 내 google_rss 기사들 중:
     *   1) link(url)에서 publisher url resolve(가능하면)
     *   2) host 추출 (google/네이버 재유통은 제외)
     *   3) 제목(또는 summary) 토큰 유사도가 컷 이상이면 evidence로 카운트
     *
     * 가산점:
     * - 외부 도메인 1개: +0.20
     * - 외부 도메인 2개: +0.35
     * - 외부 도메인 3개 이상: +0.50 (상한)
     */
    private double computeCrossBoost(News naverNews, List<News> googleItems) {
        if (googleItems == null || googleItems.isEmpty()) return 0.0;
        String nTitle = naverNews.getTitle();
        if (nTitle == null || nTitle.isBlank()) return 0.0;

        Set<String> domains = new LinkedHashSet<>();
        int matched = 0;

        for (News g : googleItems) {
            String gUrl = g.getUrl(); // ✅ News 엔티티는 url
            if (gUrl == null || gUrl.isBlank()) continue;

            // publisher url resolve (실패하면 원본 url)
            String pub = googlePublisherResolver.resolve(gUrl).orElse(gUrl);

            String host = hostOf(pub);
            if (host == null) continue;

            // 교차검증에서 google 자체/네이버 재유통은 증거로 인정 X
            if (host.contains("google.")) continue;
            if (host.contains("naver.com")) continue;

            String gTitle = g.getTitle() == null ? "" : g.getTitle();
            String gSummary = g.getSummary() == null ? "" : g.getSummary(); // RSS snippet

            double simTitle = evidenceMatcher.titleSimilarity(nTitle, gTitle);
            double simSum = evidenceMatcher.titleSimilarity(nTitle, gSummary);

            double sim = Math.max(simTitle, simSum);

            if (sim >= crossTitleThreshold) {
                matched++;
                domains.add(host);
            }
        }

        if (matched == 0) return 0.0;

        int d = domains.size();
        double boost = (d <= 1) ? 0.20 : (d == 2 ? 0.35 : crossMaxBoost);
        return Math.min(boost, crossMaxBoost);
    }

    private String hostOf(String url) {
        try {
            URI u = URI.create(url);
            String h = u.getHost();
            if (h == null) return null;
            return h.toLowerCase(Locale.ROOT);
        } catch (Exception e) {
            return null;
        }
    }

    private double clamp01(double v) {
        if (v < 0) return 0;
        if (v > 1) return 1;
        return v;
    }

    private String normalizeFlags(String flagsJson) {
        if (flagsJson == null || flagsJson.isBlank()) return "[]";
        String t = flagsJson.trim();
        // 최소 방어: JSON 배열 형태만 허용. 아니면 빈 배열로.
        if (t.startsWith("[") && t.endsWith("]")) return t;
        return "[]";
    }

    private List<EvidenceStoreService.EvidenceRow> buildEvidenceRows(News n) {
        List<String> sumSents = evidenceMatcher.splitSentences(n.getAiSummary());
        List<EvidenceStoreService.EvidenceRow> rows = new ArrayList<>(sumSents.size());

        for (int i = 0; i < sumSents.size(); i++) {
            String ss = sumSents.get(i);
            EvidenceMatcher.Match m = evidenceMatcher.bestEvidence(ss, n.getContent());
            rows.add(new EvidenceStoreService.EvidenceRow(
                    n.getId(),
                    i,
                    ss,
                    m.evidenceText(),
                    m.score(),
                    m.verdict()
            ));
        }
        return rows;
    }

    private List<ScoredNews> findTopKCandidates(News n, float[] q) {
        Timestamp ts = n.getPublishedAt() == null ? null : Timestamp.from(n.getPublishedAt());
        if (ts == null) return List.of();

        List<News> pool = newsRepository.findEmbeddingCandidates(n.getCategory(), ts, candidateHours, candidateLimit);

        List<ScoredNews> scored = new ArrayList<>();
        for (News c : pool) {
            if (Objects.equals(c.getId(), n.getId())) continue;
            if (c.getEmbedding() == null) continue;

            float[] v = vectorCodec.fromJson(c.getEmbedding());
            double sim = Vectors.cosine(q, v);
            scored.add(new ScoredNews(c, sim));
        }

        return scored.stream()
                .sorted(Comparator.comparing(ScoredNews::sim).reversed())
                .limit(topK)
                .toList();
    }

    private String computeClusterKey(News n, List<ScoredNews> candidates) {
        ScoredNews best = candidates.isEmpty() ? null : candidates.get(0);
        News base = (best != null && best.sim() >= dupThreshold) ? best.news() : n;

        String raw = (base.getProvider() == null ? "" : base.getProvider())
                + "|" + (base.getSourceId() == null ? "" : base.getSourceId());

        return sha256_64(raw);
    }

    private String bestTitle(News n, List<ScoredNews> candidates) {
        ScoredNews best = candidates.isEmpty() ? null : candidates.get(0);
        if (best != null && best.sim() >= dupThreshold && best.news().getTitle() != null) {
            return best.news().getTitle();
        }
        return n.getTitle();
    }

    private long pickRepresentative(List<News> items) {
        return items.stream()
                .sorted(Comparator.comparing(News::getPublishedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .mapToLong(News::getId)
                .findFirst()
                .orElse(items.get(0).getId());
    }

    private String sha256_64(String s) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 32; i++) sb.append(String.format("%02x", h[i]));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private record ScoredNews(News news, double sim) {}

    private static class ClusterBucket {
        final String clusterKey;
        final List<News> items = new ArrayList<>();
        ClusterBucket(String clusterKey) { this.clusterKey = clusterKey; }
    }
}

