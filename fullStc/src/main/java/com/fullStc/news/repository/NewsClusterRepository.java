package com.fullStc.news.repository;

import com.fullStc.news.domain.News;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional; // ★ 이거 임포트 필수!
import com.fullStc.news.domain.NewsCluster;

import java.util.List;
import java.util.Optional;

public interface NewsClusterRepository extends JpaRepository<NewsCluster, Long> {

        Optional<NewsCluster> findByClusterKey(String clusterKey);

        List<NewsCluster> findTop20ByClusterSummaryIsNotNullOrderByIdDesc();

        // 사용자 관심 카테고리별 클러스터 조회
        @Query(value = """
                            SELECT * FROM news_cluster
                            WHERE category IN (:categories)
                              AND cluster_summary IS NOT NULL
                              AND cluster_summary <> ''
                              AND TRIM(cluster_summary) <> ''
                            ORDER BY updated_at DESC
                            LIMIT :limit
                        """, nativeQuery = true)
        List<NewsCluster> findByCategoriesOrderByUpdatedAtDesc(
                        @Param("categories") List<String> categories,
                        @Param("limit") int limit);

        // 디버깅용: cluster_summary 조건 없이 조회
        @Query(value = """
                            SELECT * FROM news_cluster
                            WHERE category IN (:categories)
                            ORDER BY updated_at DESC
                            LIMIT :limit
                        """, nativeQuery = true)
        List<NewsCluster> findByCategoriesWithoutSummaryCheck(
                        @Param("categories") List<String> categories,
                        @Param("limit") int limit);

        // 카테고리 상관없이 최신 클러스터 조회 (관심사 미설정 시 Fallback용)
        @Query(value = """
                            SELECT * FROM news_cluster
                            WHERE cluster_summary IS NOT NULL
                              AND cluster_summary <> ''
                              AND TRIM(cluster_summary) <> ''
                            ORDER BY updated_at DESC
                            LIMIT :limit
                        """, nativeQuery = true)
        List<NewsCluster> findLatestClusters(@Param("limit") int limit);

        // ★ [핵심 수정] 여기에 @Transactional을 붙여야
        // 병렬 스레드(parallelStream)에서도 에러 없이 DB를 수정할 수 있습니다.
        @Transactional
        @Modifying
        @Query(value = """
                            UPDATE news_cluster
                            SET category = COALESCE(:category, category),
                                representative_news_id = COALESCE(:representativeNewsId, representative_news_id),
                                cluster_title = COALESCE(:clusterTitle, cluster_title),
                                quality_score = COALESCE(:qualityScore, quality_score),
                                risk_flags = COALESCE(:riskFlags, risk_flags),
                                badge = COALESCE(:badge, badge),
                                updated_at = NOW()
                            WHERE cluster_key = :clusterKey
                        """, nativeQuery = true)
        void updateClusterMetadata(
                        @Param("clusterKey") String clusterKey,
                        @Param("category") String category,
                        @Param("representativeNewsId") Long representativeNewsId,
                        @Param("clusterTitle") String clusterTitle,
                        @Param("qualityScore") Integer qualityScore,
                        @Param("riskFlags") String riskFlags,
                        @Param("badge") String badge);

        // ★ [핵심 수정] 여기도 마찬가지입니다!
        @Transactional
        @Modifying
        @Query("UPDATE NewsCluster n SET n.representativeUrl = :url, n.clusterTitle = :title, n.clusterSummary = :summary WHERE n.id = :id")
        void updateClusterSummaryInfo(
                        @Param("id") Long id,
                        @Param("url") String url,
                        @Param("title") String title,
                        @Param("summary") String summary);

        // ✅ [추가] BriefingController에서 사용하는 "카테고리별 요약본 조회" (이게 빠져 있었습니다!)
        @Query(value = "SELECT * FROM news_cluster WHERE category = :category ORDER BY id DESC LIMIT 20", nativeQuery = true)
        List<NewsCluster> findByCategoryNative(@Param("category") String category);
}