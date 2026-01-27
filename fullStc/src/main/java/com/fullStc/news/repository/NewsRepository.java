package com.fullStc.news.repository;

import com.fullStc.news.domain.News;
import com.fullStc.news.domain.NewsCluster;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NewsRepository extends JpaRepository<News, Long> {

    // =================================================================================
    // 1. 수집 및 전처리 파이프라인 (데드락 방지 적용: FOR UPDATE SKIP LOCKED)
    // =================================================================================

    // 1-1. 요약이 없는 기사 가져오기
    @Query(value = """
        SELECT * FROM news
        WHERE summary IS NULL
        ORDER BY published_at DESC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    List<News> findWithoutSummary(@Param("limit") int limit);

    // 1-2. 품질 체크 및 클러스터링 대상 (요약이나 본문이 있고, 임베딩이 있고, 아직 처리 안 된 것)
    @Query(value = """
        SELECT * FROM news
        WHERE (
             (ai_summary IS NOT NULL AND TRIM(ai_summary) <> '')
             OR 
             (content IS NOT NULL AND TRIM(content) <> '')
          )
          AND (
            embedding IS NOT NULL
            AND JSON_TYPE(embedding) <> 'NULL'
            AND JSON_LENGTH(embedding) > 0
          )
          AND (
            dup_cluster_id IS NULL
            OR verified_at IS NULL
            OR quality_score IS NULL
          )
        ORDER BY published_at DESC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    List<News> findTopForQuality(@Param("limit") int limit);

    // 1-3. RSS 본문 수집 대상 (실패 시 1시간 뒤 재시도)
    @Query(value = """
        SELECT * FROM news
        WHERE provider = 'rss'
          AND url IS NOT NULL
          AND (content IS NULL OR content = '')
          AND (content_extracted_at IS NULL OR content_extracted_at < DATE_SUB(NOW(), INTERVAL 1 HOUR))
        ORDER BY fetched_at DESC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    List<News> findRssWithoutContent(@Param("limit") int limit);

    // 1-4. 네이버 본문 수집 대상
    @Query(value = """
        SELECT * FROM news
        WHERE provider = 'naver'
          AND url IS NOT NULL
          AND (content IS NULL OR content = '')
          AND (content_extracted_at IS NULL OR content_extracted_at < DATE_SUB(NOW(), INTERVAL 1 HOUR))
        ORDER BY fetched_at DESC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    List<News> findNaverWithoutContent(@Param("limit") int limit);

    // 1-5. 임베딩 대상 (본문/요약 있음 + 임베딩 없음)
    @Query(value = """
        SELECT *
        FROM news
        WHERE (
            (ai_summary IS NOT NULL AND TRIM(ai_summary) <> '')
         OR (content    IS NOT NULL AND TRIM(content)    <> '')
        )
        AND (
            embedding IS NULL
         OR JSON_TYPE(embedding)='NULL'
         OR JSON_LENGTH(embedding)=0
        )
        ORDER BY published_at DESC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    List<News> findWithoutEmbedding(@Param("limit") int limit);

    // 1-6. 대표 기사 요약 대상
    @Query(value = """
        SELECT n.*
        FROM news n
        JOIN news_cluster c
          ON c.representative_news_id = n.id
        WHERE (n.summary IS NULL OR TRIM(n.summary) = '')
        ORDER BY c.updated_at DESC
        LIMIT :limit
        FOR UPDATE SKIP LOCKED
    """, nativeQuery = true)
    List<News> findRepresentativeTargetsForSummary(@Param("limit") int limit);


    // =================================================================================
    // 2. 검색 및 조회 (Lock 불필요)
    // =================================================================================

    // ID 목록으로 조회
    List<News> findByIdIn(List<Long> ids);

    // 클러스터 ID로 뉴스 조회
    List<News> findByDupClusterId(Long dupClusterId);

    // 임베딩 후보 검색 (유사도 비교용)
    @Query(value = """
        SELECT * FROM news
        WHERE category = :category
          AND embedding IS NOT NULL
          AND JSON_TYPE(embedding) <> 'NULL'
          AND JSON_LENGTH(embedding) > 0
          AND published_at >= DATE_SUB(:publishedAt, INTERVAL :hours HOUR)
          AND published_at <= DATE_ADD(:publishedAt, INTERVAL :hours HOUR)
        ORDER BY published_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<News> findEmbeddingCandidates(
            @Param("category") String category,
            @Param("publishedAt") java.sql.Timestamp publishedAt,
            @Param("hours") int hours,
            @Param("limit") int limit
    );

    // 최근 클러스터 목록
    @Query(value = """
        SELECT * FROM news_cluster
        WHERE (:category IS NULL OR category = :category)
        ORDER BY updated_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<NewsCluster> findRecentClusters(@Param("category") String category, @Param("limit") int limit);

    // 특정 클러스터의 뉴스 목록
    @Query(value = """
        SELECT * FROM news
        WHERE dup_cluster_id = :clusterId
        ORDER BY published_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<News> findByCluster(@Param("clusterId") long clusterId, @Param("limit") int limit);

    // 키워드 클러스터링용 (네이버, 본문O, 클러스터X)
    @Query("""
        select n from News n
        where n.provider = 'naver'
          and n.content is not null and n.content <> ''
          and n.dupClusterId is null
        order by n.id desc
    """)
    List<News> findForKeywordClustering(Pageable pageable);

    // 본문 없는 것 일반 조회
    @Query(value = """
        SELECT * FROM news
        WHERE url IS NOT NULL
          AND url <> ''
          AND (content IS NULL OR content = '')
        ORDER BY published_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<News> findWithoutContent(@Param("limit") int limit);

    // AI 요약 없는 것 조회
    @Query(value = """
        SELECT * FROM news
        WHERE content IS NOT NULL
          AND content <> ''
          AND (ai_summary IS NULL OR ai_summary = '')
        ORDER BY published_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<News> findWithoutAiSummary(@Param("limit") int limit);

    // 네이버 AI 요약 대상 조회
    @Query("""
        select n from News n
        where n.provider='naver'
          and (n.aiSummary is null or n.aiSummary = '')
          and (n.content is not null and n.content <> '')
        order by n.publishedAt desc
    """)
    List<News> findNaverWithoutAiSummary(Pageable pageable);


    // =================================================================================
    // 3. 수동 실행 및 관리자용 (ID 기반)
    // =================================================================================

    @Query("""
        select n from News n
        where n.provider = 'naver'
          and n.id in :ids
          and n.url is not null and n.url <> ''
          and (n.content is null or n.content = '')
        order by n.fetchedAt desc
    """)
    List<News> findNaverWithoutContentByIds(@Param("ids") List<Long> ids, Pageable pageable);

    @Query(value = """
        SELECT * FROM news
        WHERE id IN (:ids)
          AND content IS NOT NULL AND content <> ''
          AND (embedding IS NULL OR embedding = '' OR embedding = '[]')
        ORDER BY published_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<News> findWithoutEmbeddingByIds(@Param("ids") List<Long> ids, @Param("limit") int limit);

    @Query(value = """
        SELECT * FROM news
        WHERE id IN (:ids)
          AND (
             (ai_summary IS NOT NULL AND TRIM(ai_summary) <> '')
             OR 
             (content IS NOT NULL AND TRIM(content) <> '')
          )
          AND embedding IS NOT NULL AND embedding <> '' AND embedding <> '[]'
          AND (verified_at IS NULL OR quality_score IS NULL OR dup_cluster_id IS NULL)
        ORDER BY published_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<News> findTopForQualityByIds(@Param("ids") List<Long> ids, @Param("limit") int limit);

    @Query(value = """
        SELECT n.*
        FROM news n
        JOIN news_cluster c ON c.representative_news_id = n.id
        WHERE c.id IN (:clusterIds)
          AND (n.summary IS NULL OR TRIM(n.summary) = '')
        ORDER BY c.updated_at DESC
        LIMIT :limit
    """, nativeQuery = true)
    List<News> findRepTargetsByClusterIdsForSummary(@Param("clusterIds") List<Long> clusterIds,
                                                    @Param("limit") int limit);


    // =================================================================================
    // 4. ★ 클러스터 통계 및 집계 (교차검증 보너스용)
    // =================================================================================

    /**
     * 클러스터 ID별 기사 개수 세기용 인터페이스
     * (JPQL count 결과는 Long이므로 타입을 Long으로 맞춤)
     */
    interface ClusterCountInfo {
        Long getClusterId();
        Long getCount(); // Integer -> Long 수정
    }

    @Query("SELECT n.dupClusterId as clusterId, COUNT(n) as count " +
            "FROM News n WHERE n.dupClusterId IN :clusterIds GROUP BY n.dupClusterId")
    List<ClusterCountInfo> countByClusterIds(@Param("clusterIds") List<Long> clusterIds);

}