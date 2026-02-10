package com.fullStc.news.repository;

import com.fullStc.news.domain.NewsCluster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface NewsClusterRepository extends JpaRepository<NewsCluster, Long> {

    Optional<NewsCluster> findByClusterKey(String clusterKey);

<<<<<<< HEAD
        // =================================================================
        // ★ [NEW] 최신순 정렬을 위한 핵심 메소드 2개 (이걸 서비스에서 호출해야 함)
        // =================================================================

        // 1. [전체 보기]용: ID가 큰 순서(=최신순)로 다 가져오기
        List<NewsCluster> findAllByOrderByIdDesc();

        // 2. [카테고리별 보기]용: 해당 카테고리만 ID가 큰 순서(=최신순)로 가져오기
        List<NewsCluster> findByCategoryOrderByIdDesc(String category);

        // =================================================================

        // (기존) 상위 20개 조회
        List<NewsCluster> findTop20ByClusterSummaryIsNotNullOrderByIdDesc();

        // (기존) 사용자 관심 카테고리별 클러스터 조회
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

        // (기존) 디버깅용
        @Query(value = """
                        SELECT * FROM news_cluster
                        WHERE category IN (:categories)
                            ORDER BY updated_at DESC
                        LIMIT :limit
                    """, nativeQuery = true)
        List<NewsCluster> findByCategoriesWithoutSummaryCheck(
                @Param("categories") List<String> categories,
                @Param("limit") int limit);

        // (기존) 카테고리 상관없이 최신 클러스터 조회
        @Query(value = """
                        SELECT * FROM news_cluster
                        WHERE cluster_summary IS NOT NULL
                          AND cluster_summary <> ''
                          AND TRIM(cluster_summary) <> ''
                        ORDER BY updated_at DESC
                        LIMIT :limit
                    """, nativeQuery = true)
        List<NewsCluster> findLatestClusters(@Param("limit") int limit);

        // (기존) 메타데이터 업데이트
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

        // (기존) 요약 정보 및 이미지 업데이트
        @Transactional
        @Modifying
        @Query("UPDATE NewsCluster c SET " +
                "c.representativeUrl = :repUrl, " +
                "c.clusterTitle = :title, " +
                "c.clusterSummary = :summary, " +
                "c.imageUrl = :imageUrl " +
                "WHERE c.id = :id")
        void updateClusterSummaryInfo(
                @Param("id") Long id,
                @Param("repUrl") String repUrl,
                @Param("title") String title,
                @Param("summary") String summary,
                @Param("imageUrl") String imageUrl
        );

        // (기존) 네이티브 쿼리용 - 이것도 ID DESC로 되어 있어서 최신순 맞음
        @Query(value = "SELECT * FROM news_cluster WHERE category = :category ORDER BY id DESC LIMIT 20", nativeQuery = true)
        List<NewsCluster> findByCategoryNative(@Param("category") String category);

        @Query("""
        select c from NewsCluster c
        where c.imageStatus = 'FAILED'
          and c.imageNextRetryAt is not null
          and c.imageNextRetryAt <= :now
        order by c.imageNextRetryAt asc
    """)
        List<NewsCluster> findRetryDue(@Param("now") Instant now);
=======
    List<NewsCluster> findTop20ByClusterSummaryIsNotNullOrderByIdDesc();

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
            @Param("badge") String badge
    );

    // ★ [핵심 수정] 여기도 마찬가지입니다!
    @Transactional
    @Modifying
    @Query("UPDATE NewsCluster n SET n.representativeUrl = :url, n.clusterTitle = :title, n.clusterSummary = :summary WHERE n.id = :id")
    void updateClusterSummaryInfo(
            @Param("id") Long id,
            @Param("url") String url,
            @Param("title") String title,
            @Param("summary") String summary
    );
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
}