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
     * - 클러스터 ID 목록을 받아 뉴스들을 조회하고
     * - 1등 기사 URL 선정
     * - AI를 통해 제목과 요약 생성 후 저장
     */
    @Transactional
    public int generateRepresentativeSummariesForClusterIds(List<Long> clusterIds, int limit) {
        if (clusterIds == null || clusterIds.isEmpty()) return 0;

        // 1. 요약 대상 클러스터 조회
        List<NewsCluster> clusters = newsClusterRepository.findAllById(clusterIds);

        // ★ [핵심] parallelStream()을 사용하여 병렬 처리 (속도 대폭 향상)
        // mapToInt().sum() 패턴을 사용하여 스레드 안전하게 성공 횟수를 집계합니다.
        int successCount = clusters.parallelStream().mapToInt(cluster -> {

            // 이미 요약이 있으면 건너뜀 (API 비용 절약)
            if (cluster.getClusterSummary() != null && !cluster.getClusterSummary().isBlank()) {
                return 0; // skip
            }

            try {
                // 2. 해당 그룹의 뉴스들 가져오기
                // (병렬 스레드에서도 Repository 읽기는 문제없이 동작함)
                List<News> newsList = newsRepository.findByDupClusterId(cluster.getId());
                if (newsList.isEmpty()) return 0;

                // -------------------------------------------------------
                // ★ [Step 1] 신뢰도(Quality Score) 1등 기사 찾기 (대표 링크용)
                // -------------------------------------------------------
                News bestNews = newsList.stream()
                        .max(Comparator.comparingInt(n -> n.getQualityScore() == null ? 0 : n.getQualityScore()))
                        .orElse(newsList.get(0)); // 점수 없으면 첫 번째 뉴스 선택

                cluster.setRepresentativeUrl(bestNews.getUrl());

                // -------------------------------------------------------
                // ★ [Step 2] AI에게 제목과 요약 생성 요청 (여기서 병렬 효과 극대화)
                // -------------------------------------------------------
                String fullResponse = openAiSummarizer.summarizeCluster(newsList);

                if (fullResponse != null && !fullResponse.isBlank()) {
                    // 3. 응답 쪼개기
                    String[] parts = parseTitleAndSummary(fullResponse);
                    String aiTitle = parts[0];
                    String aiSummary = parts[1];

                    // 4. 최종 저장
                    cluster.setClusterTitle(aiTitle);
                    cluster.setClusterSummary(aiSummary);

                    // 병렬 스트림 내부에서 저장은 개별 트랜잭션처럼 동작하여 즉시 반영됨
                    newsClusterRepository.save(cluster);

                    log.info("🎉 [SUMMARY] Cluster ID={} 완료! 제목: '{}' (링크: {})",
                            cluster.getId(), aiTitle, bestNews.getUrl());

                    return 1; // 성공 카운트 +1
                }

            } catch (Exception e) {
                log.error("💥 [SUMMARY] Cluster ID={} 실패: {}", cluster.getId(), e.getMessage());
            }
            return 0; // 실패 시 카운트 0
        }).sum(); // 병렬 처리된 결과 합산

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
            // 줄바꿈이 없으면 전체를 요약으로 간주
            return new String[]{"AI 자동 생성 제목", clean};
        }
    }
}