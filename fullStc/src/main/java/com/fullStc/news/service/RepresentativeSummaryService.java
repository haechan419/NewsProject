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
public class RepresentativeSummaryService {

    private final NewsRepository newsRepository;
    private final NewsClusterRepository newsClusterRepository;
    private final OpenAiSummarizer openAiSummarizer;

    /**
     * 파이프라인에서 호출하는 메인 메소드
     */
    @Transactional
    public int generateRepresentativeSummariesForClusterIds(List<Long> clusterIds, int limit) {
        if (clusterIds == null || clusterIds.isEmpty()) return 0;

        // 1. 요약 대상 클러스터 조회
        List<NewsCluster> clusters = newsClusterRepository.findAllById(clusterIds);

        // ★ [핵심] parallelStream()을 사용하여 병렬 처리
        int successCount = clusters.parallelStream().mapToInt(cluster -> {

            // 이미 요약이 있으면 건너뜀 (API 비용 절약)
            if (cluster.getClusterSummary() != null && !cluster.getClusterSummary().isBlank()) {
                return 0; // skip
            }

            try {
                // 2. 해당 그룹의 뉴스들 가져오기
                List<News> newsList = newsRepository.findByDupClusterId(cluster.getId());
                if (newsList.isEmpty()) return 0;

                // -------------------------------------------------------
                // ★ [Step 1] 신뢰도(Quality Score) 1등 기사 찾기 (대표 링크용)
                // -------------------------------------------------------
                News bestNews = newsList.stream()
                        .max(Comparator.comparingInt(n -> n.getQualityScore() == null ? 0 : n.getQualityScore()))
                        .orElse(newsList.get(0));

                String bestUrl = bestNews.getUrl();

                // -------------------------------------------------------
                // ★ [Step 2] AI에게 제목과 요약 생성 요청
                // -------------------------------------------------------
                String fullResponse = openAiSummarizer.summarizeCluster(newsList);

                if (fullResponse != null && !fullResponse.isBlank()) {
                    // 3. 응답 쪼개기
                    String[] parts = parseTitleAndSummary(fullResponse);
                    String aiTitle = parts[0];
                    String aiSummary = parts[1];

                    // 4. 최종 저장 (★ 충돌 해결 부분!)
                    // 기존: cluster.set... 후 repo.save(cluster) -> 에러 발생 원인
                    // 변경: 필요한 3개 컬럼만 직접 UPDATE (파이썬과 충돌 안 남)
                    newsClusterRepository.updateClusterSummaryInfo(
                            cluster.getId(),
                            bestUrl,
                            aiTitle,
                            aiSummary
                    );

                    log.info("🎉 [SUMMARY] Cluster ID={} 완료! 제목: '{}'", cluster.getId(), aiTitle);

                    return 1; // 성공 카운트 +1
                }

            } catch (Exception e) {
                log.error("💥 [SUMMARY] Cluster ID={} 실패: {}", cluster.getId(), e.getMessage());
            }
            return 0; // 실패 시 카운트 0
        }).sum();

        return successCount;
    }

    /**
     * AI 응답 텍스트를 분석해서 [제목]과 [내용]으로 분리하는 메소드
     */
    private String[] parseTitleAndSummary(String text) {
        // 불필요한 태그 제거
        String clean = text.replace("[제목]", "").replace("[요약]", "").trim();

        // 첫 번째 줄바꿈을 기준으로 자름
        int firstNewLine = clean.indexOf("\n");

        if (firstNewLine > 0) {
            String title = clean.substring(0, firstNewLine).trim();
            // 제목 앞뒤의 따옴표나 특수문자 제거
            title = title.replaceAll("^[\"']|[\"']$", "").replaceAll("^[-*]\\s*", "").trim();

            String summary = clean.substring(firstNewLine).trim();
            return new String[]{title, summary};
        } else {
            return new String[]{"AI 자동 생성 제목", clean};
        }
    }
}