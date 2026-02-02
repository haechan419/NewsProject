package com.fullStc.news.service;

import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.dto.BriefingResponseDTO;
import com.fullStc.news.repository.NewsClusterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 사용자 관심 카테고리별 뉴스 클러스터 조회 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserCategoryNewsService {

    private final NewsClusterRepository newsClusterRepository;

    /**
     * 사용자 관심 카테고리 목록에 해당하는 뉴스 클러스터 조회
     *
     * @param categories 사용자 관심 카테고리 목록 (예: ["culture", "economy", "it"])
     * @param limit      조회할 최대 개수
     * @return BriefingResponseDTO 리스트
     */
    public List<BriefingResponseDTO> getNewsByUserCategories(List<String> categories, int limit) {
        log.info("사용자 관심 카테고리별 뉴스 조회: categories={}, limit={}", categories, limit);

        if (categories == null || categories.isEmpty()) {
            log.info("관심 카테고리가 없어 전체 최신 뉴스를 조회합니다.");
            List<NewsCluster> latestClusters = newsClusterRepository.findLatestClusters(limit);
            return latestClusters.stream()
                    .map(BriefingResponseDTO::new)
                    .collect(Collectors.toList());
        }

        // 카테고리를 소문자로 정규화 (대소문자 구분 없이 검색)
        List<String> normalizedCategories = categories.stream()
                .map(cat -> cat != null ? cat.toLowerCase().trim() : null)
                .filter(cat -> cat != null && !cat.isEmpty())
                .collect(Collectors.toList());

        log.info("정규화된 카테고리: {}", normalizedCategories);

        if (normalizedCategories.isEmpty()) {
            log.warn("유효한 카테고리가 없습니다.");
            return List.of();
        }

        // 카테고리별 클러스터 조회
        log.info("Repository 호출 전: categories={}, limit={}", normalizedCategories, limit);
        List<NewsCluster> clusters = newsClusterRepository.findByCategoriesOrderByUpdatedAtDesc(
                normalizedCategories,
                limit);

        log.info("조회된 클러스터 개수: {}", clusters.size());
        if (clusters.isEmpty()) {
            log.warn("카테고리 {}에 대한 클러스터가 없습니다. cluster_summary 조건 없이 재조회 시도...", normalizedCategories);
            // 디버깅: cluster_summary 조건 없이 조회해보기
            try {
                List<NewsCluster> clustersWithoutSummary = newsClusterRepository.findByCategoriesWithoutSummaryCheck(
                        normalizedCategories, limit);
                log.info("cluster_summary 조건 제외 시 조회된 클러스터 개수: {}", clustersWithoutSummary.size());
                if (!clustersWithoutSummary.isEmpty()) {
                    log.warn("cluster_summary 조건 때문에 데이터가 필터링되었습니다. cluster_summary가 NULL이거나 빈 문자열인 데이터가 있습니다.");
                    // cluster_summary가 있는 것만 필터링
                    List<NewsCluster> withSummary = clustersWithoutSummary.stream()
                            .filter(c -> c.getClusterSummary() != null
                                    && !c.getClusterSummary().trim().isEmpty())
                            .collect(Collectors.toList());
                    log.info("cluster_summary가 있는 클러스터: {}개", withSummary.size());
                    if (!withSummary.isEmpty()) {
                        // cluster_summary가 있는 것만 반환
                        return withSummary.stream()
                                .map(BriefingResponseDTO::new)
                                .collect(Collectors.toList());
                    }
                }
            } catch (Exception e) {
                log.warn("디버깅 쿼리 실행 실패", e);
            }
        } else {
            log.info("조회된 클러스터 카테고리: {}",
                    clusters.stream().map(c -> c.getCategory()).distinct().collect(Collectors.toList()));
        }

        // DTO로 변환
        return clusters.stream()
                .map(BriefingResponseDTO::new)
                .collect(Collectors.toList());
    }
}
