package com.fullStc.news.repository;

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
}