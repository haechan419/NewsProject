package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fullStc.news.domain.News;
import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.repository.NewsClusterRepository;
import com.fullStc.news.repository.NewsRepository;

import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RepresentativeSummaryService {

    private final NewsRepository newsRepository;
    private final NewsClusterRepository newsClusterRepository;
    private final OpenAiSummarizer openAiSummarizer;

    // ★ [NEW] 1. 이미지 생성 서비스 주입
    private final PollinationsImageService pollinationsImageService;

    @Transactional
    public int generateRepresentativeSummariesForClusterIds(List<Long> clusterIds, int limit) {
        if (clusterIds == null || clusterIds.isEmpty())
            return 0;

        List<NewsCluster> clusters = newsClusterRepository.findAllById(clusterIds);

        int successCount = clusters.parallelStream().mapToInt(cluster -> {

            if (cluster.getClusterSummary() != null && !cluster.getClusterSummary().isBlank()) {
                return 0;
            }

            try {
                List<News> newsList = newsRepository.findByDupClusterId(cluster.getId());
                if (newsList.isEmpty()) return 0;

                News bestNews = newsList.stream()
                        .max(Comparator.comparingInt(n -> n.getQualityScore() == null ? 0 : n.getQualityScore()))
                        .orElse(newsList.get(0));

                String bestUrl = bestNews.getUrl();

                // AI 요약 생성
                String fullResponse = openAiSummarizer.summarizeCluster(newsList);

                if (fullResponse != null && !fullResponse.isBlank()) {
                    String[] parts = parseTitleAndSummary(fullResponse);
                    String aiTitle = parts[0];
                    String aiSummary = parts[1];

                    // =======================================================
                    // ★ [NEW] 2. Pollinations로 이미지 URL 생성 (쓱싹!)
                    // =======================================================
                    // 요약 내용(aiSummary)을 바탕으로 이미지 URL을 따옵니다.
                    String dynamicImageUrl = pollinationsImageService.generateImageUrl(aiSummary);

                    // 3. 최종 저장 (이미지 URL 포함)
                    // Repo 메소드에 인자를 하나 더 추가해야 합니다!
                    newsClusterRepository.updateClusterSummaryInfo(
                            cluster.getId(),
                            bestUrl,
                            aiTitle,
                            aiSummary,
                            dynamicImageUrl // ★ 여기에 이미지 URL 추가
                    );

                    log.info("🎉 [SUMMARY] Cluster ID={} 완료! (이미지 포함)", cluster.getId());

                    return 1;
                }

            } catch (Exception e) {
                log.error("💥 [SUMMARY] Cluster ID={} 실패: {}", cluster.getId(), e.getMessage());
            }
            return 0;
        }).sum();

        return successCount;
    }

    private String[] parseTitleAndSummary(String text) {
        String clean = text.replace("[제목]", "").replace("[요약]", "").trim();
        int firstNewLine = clean.indexOf("\n");
        if (firstNewLine > 0) {
            String title = clean.substring(0, firstNewLine).replaceAll("^[\"']|[\"']$", "").replaceAll("^[-*]\\s*", "").trim();
            String summary = clean.substring(firstNewLine).trim();
            return new String[] { title, summary };
        } else {
            return new String[] { "AI 자동 생성 제목", clean };
        }
    }
}