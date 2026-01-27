package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.fullStc.news.domain.CategoryKeywords;
import com.fullStc.news.dto.NewsResponse;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PipelineOrchestratorService {

    // 1. 수집기
    private final NewsAggregatorService newsAggregatorService;

    // 2. 기존 서비스들
    private final NaverEnrichService naverEnrichService;
    private final RssEnrichService rssEnrichService;
    private final EmbeddingBatchService embeddingBatchService;
    private final NewsQualityPythonService qualityService;
    private final RepresentativeSummaryService representativeSummaryService;

    /**
     * 스케줄러 진입점
     */
    public void processNewNews(String category) {
        try {
            String query = CategoryKeywords.buildQuery(category, null);

            log.info("🚀 [PIPELINE-ROOT] Start Fetching for category='{}', query='{}'", category, query);

            // ★ [수정 포인트] 리턴값이 List<Long>이 아니라 NewsResponse 객체입니다.
            NewsResponse response = newsAggregatorService.fetchAndSave(category, query, 30);

            // ★ [수정 포인트] 객체 안에서 ID 목록을 꺼냅니다.
            List<Long> newIds = response.getInsertedIds();

            // (3) 가져온 게 있으면 파이프라인 가동
            if (newIds != null && !newIds.isEmpty()) {
                processNewOnly(newIds);
            } else {
                log.info("💤 [PIPELINE-ROOT] No new news found for '{}'", category);
            }

        } catch (Exception e) {
            log.error("💥 [PIPELINE-ROOT] Failed to process category '{}': {}", category, e.getMessage());
        }
    }

    /**
     * 기존 파이프라인 (아래는 변경 없음, 그대로 유지)
     */
    public void processNewOnly(List<Long> insertedIds) {
        if (insertedIds == null || insertedIds.isEmpty()) return;

        log.info("[PIPELINE-START] Processing {} new items...", insertedIds.size());

        // 1. Enrich
        int contentFilled = 0;
        try {
            var naverResult = naverEnrichService.enrichForIds(insertedIds, insertedIds.size());
            contentFilled += naverResult.contentFilled();
            rssEnrichService.enrichForIds(insertedIds);
        } catch (Exception e) {
            log.error("[PIPELINE-ERROR] Enrich failed: {}", e.getMessage());
        }

        // 2. Embedding
        int embCount = 0;
        try {
            embCount = embeddingBatchService.fillEmbeddingsForIds(insertedIds, insertedIds.size());
        } catch (Exception e) {
            log.error("[PIPELINE-ERROR] Embedding failed: {}", e.getMessage());
        }

        // 3. Quality & Clustering
        int verifiedCount = 0;
        int clusterCount = 0;
        List<Long> touchedClusters = Collections.emptyList();

        try {
            var qr = qualityService.runQualityWithClusteringForIds(insertedIds, insertedIds.size());
            verifiedCount = qr.updatedNews();
            touchedClusters = qr.touchedClusterIds();
            clusterCount = touchedClusters.size();

            // 보너스 점수
            qualityService.applyCrossSourceBonus(insertedIds);
        } catch (Exception e) {
            log.error("[PIPELINE-ERROR] Quality/Clustering failed: {}", e.getMessage());
        }

        // 4. Summary
        int repCount = 0;
        if (touchedClusters != null && !touchedClusters.isEmpty()) {
            try {
                repCount = representativeSummaryService.generateRepresentativeSummariesForClusterIds(touchedClusters, 50);
            } catch (Exception e) {
                log.error("[PIPELINE-ERROR] RepSummary failed: {}", e.getMessage());
            }
        }

        log.info("🏁 [PIPELINE-END] Input={} | Enrich={} | Embed={} | Quality={} | Cluster={} | Summary={}",
                insertedIds.size(), contentFilled, embCount, verifiedCount, clusterCount, repCount);
    }
}