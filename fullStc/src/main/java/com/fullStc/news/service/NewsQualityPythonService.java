package com.fullStc.news.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fullStc.news.domain.News;
import com.fullStc.news.repository.NewsRepository;
// ★ 이미 있는 인터페이스 import (위치에 따라 경로 확인 필요)
import com.fullStc.news.repository.NewsRepository.ClusterCountInfo;
import com.fullStc.news.service.NewsQualityStoreService.QualityUpdate;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsQualityPythonService {

    private final NewsRepository newsRepository;
    private final VectorCodec vectorCodec;
    private final PythonQualityRunnerService pythonRunner;

    private final NewsClusterStoreService clusterStore;
    private final NewsQualityStoreService qualityStore;
    private final EvidenceStoreService evidenceStore;

    private final ObjectMapper om = new ObjectMapper();

    private final int candidateHours = 48;
    private final int candidateLimit = 800;
    private final int topK = 20;
    private final double dupThreshold = 0.60;

    /** 결과 DTO */
    public record QualityRunResult(int updatedNews, List<Long> touchedClusterIds) {}

    @Transactional
    public int runQualityWithClustering(int limit) {
        List<News> targets = newsRepository.findTopForQuality(limit);
        if (targets == null || targets.isEmpty()) return 0;

        List<Long> ids = targets.stream().map(News::getId).toList();
        return runQualityWithClusteringForIds(ids, limit).updatedNews();
    }

    /**
     * ✅ NEW-only: 이번 ids만 타겟으로 클러스터+품질 실행
     */
    @Transactional
    public QualityRunResult runQualityWithClusteringForIds(List<Long> ids, int limit) {

        if (ids == null || ids.isEmpty()) return new QualityRunResult(0, List.of());

        List<News> targets = newsRepository.findTopForQualityByIds(ids, limit);
        if (targets == null || targets.isEmpty()) return new QualityRunResult(0, List.of());

        Instant now = Instant.now();

        // clusterId -> bucket
        Map<Long, ClusterBucket> buckets = new LinkedHashMap<>();

        // =========================
        // 1) embedding 기반 clustering
        // =========================
        for (News n : targets) {
            if (n.getPublishedAt() == null) continue;
            if (n.getEmbedding() == null || n.getEmbedding().isBlank()) continue;

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
            buckets.computeIfAbsent(clusterId, k -> new ClusterBucket(clusterKey))
                    .items.add(n);
        }

        if (buckets.isEmpty()) return new QualityRunResult(0, List.of());

        // =========================
        // 2) python payload
        // =========================
        List<Map<String, Object>> payload = new ArrayList<>();

        for (var entry : buckets.entrySet()) {
            long clusterId = entry.getKey();
            ClusterBucket bucket = entry.getValue();

            int crossSourceCount = (int) bucket.items.stream()
                    .map(News::getProvider)
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();
            if (crossSourceCount <= 0) crossSourceCount = 1;

            for (News n : bucket.items) {
                String text = null;
                if (n.getContent() != null && !n.getContent().isBlank()) text = n.getContent();
                else if (n.getAiSummary() != null && !n.getAiSummary().isBlank()) text = n.getAiSummary();
                if (text == null || text.isBlank()) continue;

                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", n.getId());
                m.put("title", n.getTitle());
                m.put("content", text);
                m.put("cross_source_count", crossSourceCount);
                m.put("cluster_id", clusterId);
                payload.add(m);
            }
        }

        if (payload.isEmpty()) return new QualityRunResult(0, List.of());

        // =========================
        // 3) python run
        // =========================
        List<Map<String, Object>> results = pythonRunner.runQualityCheck(payload);

        Map<Long, Map<String, Object>> byNewsId = new HashMap<>();
        for (Map<String, Object> r : results) {
            Object nid = r.get("news_id");
            if (nid == null) continue;
            byNewsId.put(((Number) nid).longValue(), r);
        }

        // =========================
        // 4) evidence + updates
        // =========================
        List<QualityUpdate> updates = new ArrayList<>();
        Set<Long> touchedClusterIds = new LinkedHashSet<>();

        for (var entry : buckets.entrySet()) {
            long clusterId = entry.getKey();
            ClusterBucket bucket = entry.getValue();
            touchedClusterIds.add(clusterId);

            List<Integer> scores = new ArrayList<>();
            Set<String> unionFlags = new LinkedHashSet<>();
            String badgeAgg = "✅";

            RepresentativePick rep = pickRepresentativeByQuality(bucket.items, byNewsId);
            long repNewsId = rep.newsId();
            String repTitle = rep.title();

            for (News n : bucket.items) {
                Map<String, Object> r = byNewsId.get(n.getId());
                if (r == null) continue;

                int score = ((Number) r.get("quality_score")).intValue();
                scores.add(score);

                Object flagsObj = r.get("risk_flags");
                if (flagsObj instanceof List<?> list) {
                    for (Object x : list) if (x != null) unionFlags.add(String.valueOf(x));
                }

                String badge = (String) r.get("badge");
                badgeAgg = worstBadge(badgeAgg, badge);

                evidenceStore.deleteByNewsId(n.getId());
                List<EvidenceStoreService.EvidenceRow> rows =
                        parseEvidence(n.getId(), r.get("evidence"));
                evidenceStore.batchInsert(rows);

                updates.add(new QualityUpdate(
                        n.getId(),
                        clusterId,
                        score,
                        toJson(flagsObj),
                        badge,
                        now
                ));
            }

            if (!scores.isEmpty()) {
                int clusterScore = (int) Math.round(scores.stream().mapToInt(i -> i).average().orElse(0));
                clusterStore.upsertCluster(
                        bucket.clusterKey,
                        bucket.items.get(0).getCategory(),
                        repNewsId,
                        repTitle,
                        clusterScore,
                        toJson(new ArrayList<>(unionFlags)),
                        badgeAgg
                );
            }
        }

        if (!updates.isEmpty()) qualityStore.batchUpdateQuality(updates);

        return new QualityRunResult(updates.size(), touchedClusterIds.stream().toList());
    }

    // ==========================================================
    //                   Helpers
    // ==========================================================

    private List<ScoredNews> findTopKCandidates(News n, float[] q) {
        java.sql.Timestamp ts = java.sql.Timestamp.from(n.getPublishedAt());
        List<News> pool = newsRepository.findEmbeddingCandidates(
                n.getCategory(), ts, candidateHours, candidateLimit
        );
        List<ScoredNews> scored = new ArrayList<>();
        for (News c : pool) {
            if (Objects.equals(c.getId(), n.getId())) continue;
            if (c.getEmbedding() == null || c.getEmbedding().isBlank()) continue;
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
        String norm = normalizeTitle(base.getTitle());
        if (norm.isBlank()) {
            String raw = safe(base.getProvider()) + "|" + safe(base.getUrl());
            return sha256_64(raw);
        }
        return sha256_64(norm);
    }

    private String normalizeTitle(String s) {
        if (s == null) return "";
        String x = s.toLowerCase();
        x = x.replaceAll("\\[[^\\]]*\\]", " ");
        x = x.replaceAll("\\([^\\)]*\\)", " ");
        x = x.replaceAll("[\"'“”‘’]", " ");
        x = x.replaceAll("[^0-9a-z가-힣\\s]", " ");
        x = x.replaceAll("\\s+", " ").trim();
        if (x.length() < 10) return "";
        if (x.length() > 120) x = x.substring(0, 120);
        return x;
    }

    private String bestTitle(News n, List<ScoredNews> candidates) {
        ScoredNews best = candidates.isEmpty() ? null : candidates.get(0);
        if (best != null && best.sim() >= dupThreshold && best.news().getTitle() != null)
            return best.news().getTitle();
        return n.getTitle();
    }

    private long pickRepresentative(List<News> items) {
        return items.stream()
                .sorted(Comparator.comparing(
                        News::getPublishedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())
                ).reversed())
                .mapToLong(News::getId)
                .findFirst()
                .orElse(items.get(0).getId());
    }

    private String pickRepresentativeTitle(List<News> items, long repId) {
        return items.stream()
                .filter(n -> Objects.equals(n.getId(), repId))
                .map(News::getTitle)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(items.get(0).getTitle());
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

    private String safe(String s) { return s == null ? "" : s; }

    private String toJson(Object obj) {
        try { return om.writeValueAsString(obj); }
        catch (Exception e) { return "[]"; }
    }

    private List<EvidenceStoreService.EvidenceRow> parseEvidence(Long newsId, Object evidenceObj) {
        if (!(evidenceObj instanceof List<?> list)) return List.of();
        List<EvidenceStoreService.EvidenceRow> rows = new ArrayList<>();
        for (Object o : list) {
            if (!(o instanceof Map<?, ?> m)) continue;
            rows.add(new EvidenceStoreService.EvidenceRow(
                    newsId,
                    ((Number) m.get("sent_idx")).intValue(),
                    (String) m.get("summary_sent"),
                    (String) m.get("evidence_text"),
                    ((Number) m.get("score")).doubleValue(),
                    (String) m.get("verdict")
            ));
        }
        return rows;
    }

    private String worstBadge(String a, String b) {
        return badgeRank(a) >= badgeRank(b) ? a : b;
    }

    private int badgeRank(String b) {
        if ("❌".equals(b)) return 3;
        if ("⚠️".equals(b)) return 2;
        return 1;
    }

    private record ScoredNews(News news, double sim) {}
    private static class ClusterBucket {
        final String clusterKey;
        final List<News> items = new ArrayList<>();
        ClusterBucket(String clusterKey) { this.clusterKey = clusterKey; }
    }

    private record RepresentativePick(long newsId, String title) {}

    private RepresentativePick pickRepresentativeByQuality(List<News> items,
                                                           Map<Long, Map<String, Object>> byNewsId) {
        List<News> candidates = new ArrayList<>();
        for (News n : items) {
            if (byNewsId.containsKey(n.getId())) candidates.add(n);
        }
        if (candidates.isEmpty()) {
            long id = pickRepresentative(items);
            return new RepresentativePick(id, pickRepresentativeTitle(items, id));
        }
        News best = candidates.stream()
                .max(Comparator
                        .comparingInt((News n) -> getQualityScore(byNewsId.get(n.getId())))
                        .thenComparingInt(n -> getBadgeRankPref(byNewsId.get(n.getId())))
                        .thenComparing(News::getPublishedAt, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparingLong(News::getId)
                )
                .orElse(candidates.get(0));
        return new RepresentativePick(best.getId(), best.getTitle());
    }

    private int getQualityScore(Map<String, Object> r) {
        if (r == null) return -1;
        Object s = r.get("quality_score");
        if (s instanceof Number n) return n.intValue();
        return -1;
    }

    private int getBadgeRankPref(Map<String, Object> r) {
        if (r == null) return 0;
        Object b = r.get("badge");
        String badge = b == null ? "" : String.valueOf(b);
        if ("✅".equals(badge)) return 3;
        if ("⚠️".equals(badge)) return 2;
        if ("❌".equals(badge)) return 1;
        return 0;
    }

    // ==========================================================
    //                Cross Source Bonus Logic (수정됨)
    // ==========================================================

    public void applyCrossSourceBonus(List<Long> newsIds) {
        if (newsIds.isEmpty()) return;

        List<News> newsList = newsRepository.findAllById(newsIds);

        List<Long> clusterIds = newsList.stream()
                .map(News::getDupClusterId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (clusterIds.isEmpty()) return;

        // ★ 기존의 countByClusterIds (ClusterCountInfo) 사용
        // 보통 COUNT()는 Long을 반환하므로 Map<Long, Long> 사용
        Map<Long, Long> clusterCounts = newsRepository.countByClusterIds(clusterIds)
                .stream()
                .collect(Collectors.toMap(
                        info -> info.getClusterId(),
                        info -> info.getCount()
                ));

        List<News> toUpdate = new ArrayList<>();

        for (News n : newsList) {
            if (n.getDupClusterId() == null) continue;

            // map에서 꺼낸 값은 Long
            long count = clusterCounts.getOrDefault(n.getDupClusterId(), 0L);

            if (count > 1) { // 친구가 있으면 (2개 이상)
                boolean changed = false;

                if (n.getQualityScore() != null && n.getQualityScore() < 100) {
                    int newScore = Math.min(100, n.getQualityScore() + 15);
                    n.setQualityScore(newScore);

                    if (newScore >= 80) n.setBadge("✅");
                    else if (newScore >= 50) n.setBadge("⚠️");
                    changed = true;
                }

                if (n.getRiskFlags() != null && n.getRiskFlags().contains("LOW_CROSS_SOURCE")) {
                    String cleanFlags = n.getRiskFlags()
                            .replace("\"LOW_CROSS_SOURCE\",", "")
                            .replace(", \"LOW_CROSS_SOURCE\"", "")
                            .replace("\"LOW_CROSS_SOURCE\"", "");
                    n.setRiskFlags(cleanFlags);
                    changed = true;
                }

                if (changed) {
                    toUpdate.add(n);
                    log.info("[BONUS] ID={} ClusterSize={} ScoreUp! -> {}", n.getId(), count, n.getQualityScore());
                }
            }
        }

        if (!toUpdate.isEmpty()) {
            newsRepository.saveAll(toUpdate);
        }
    }
}