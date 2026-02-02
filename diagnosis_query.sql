-- ============================================
-- 진단 쿼리: 최근 1시간 데이터 상태 확인
-- ============================================

-- 1. 전체 상태 확인
SELECT 
    n.id,
    LEFT(n.title, 30) AS '제목',
    -- 필수 조건 체크
    CASE 
        WHEN n.content IS NOT NULL AND TRIM(n.content) <> '' THEN '✅본문' 
        WHEN n.ai_summary IS NOT NULL AND TRIM(n.ai_summary) <> '' THEN '✅AI요약'
        ELSE '❌없음' 
    END AS '텍스트',
    CASE 
        WHEN n.embedding IS NOT NULL 
         AND JSON_TYPE(n.embedding) <> 'NULL' 
         AND JSON_LENGTH(n.embedding) > 0 
         THEN '✅임베딩' 
        ELSE '❌없음' 
    END AS '임베딩',
    -- 처리 상태
    CASE 
        WHEN n.quality_score IS NOT NULL THEN CONCAT(n.quality_score, '점')
        ELSE '❌미처리'
    END AS '점수',
    CASE 
        WHEN n.dup_cluster_id IS NOT NULL THEN CONCAT('그룹#', n.dup_cluster_id)
        ELSE '❌미처리'
    END AS '클러스터',
    CASE 
        WHEN c.cluster_summary IS NOT NULL AND TRIM(c.cluster_summary) <> '' THEN '✅완료'
        WHEN n.dup_cluster_id IS NOT NULL THEN '⏳진행중'
        ELSE '-'
    END AS '요약',
    n.fetched_at AS '수집시간'
FROM news n
LEFT JOIN news_cluster c ON n.dup_cluster_id = c.id
WHERE n.fetched_at > NOW() - INTERVAL 1 HOUR
ORDER BY n.id DESC;

-- ============================================
-- 2. 처리 가능한 데이터 개수 확인
-- ============================================
SELECT 
    COUNT(*) as '처리가능한_데이터수',
    SUM(CASE WHEN content IS NOT NULL AND TRIM(content) <> '' THEN 1 ELSE 0 END) as '본문있음',
    SUM(CASE WHEN ai_summary IS NOT NULL AND TRIM(ai_summary) <> '' THEN 1 ELSE 0 END) as 'AI요약있음',
    SUM(CASE WHEN embedding IS NOT NULL 
             AND JSON_TYPE(embedding) <> 'NULL' 
             AND JSON_LENGTH(embedding) > 0 
             THEN 1 ELSE 0 END) as '임베딩있음',
    SUM(CASE WHEN (content IS NOT NULL AND TRIM(content) <> '') 
                  OR (ai_summary IS NOT NULL AND TRIM(ai_summary) <> '')
             THEN 1 ELSE 0 END) as '텍스트있음',
    SUM(CASE WHEN (
        (ai_summary IS NOT NULL AND TRIM(ai_summary) <> '')
        OR (content IS NOT NULL AND TRIM(content) <> '')
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
    ) THEN 1 ELSE 0 END) as '실제처리가능'
FROM news
WHERE fetched_at > NOW() - INTERVAL 1 HOUR;

-- ============================================
-- 3. 처리되지 않은 데이터 ID 목록 (API 호출용)
-- ============================================
SELECT GROUP_CONCAT(id ORDER BY id DESC) as '처리대상_ID목록'
FROM news
WHERE (
    (ai_summary IS NOT NULL AND TRIM(ai_summary) <> '')
    OR (content IS NOT NULL AND TRIM(content) <> '')
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
AND fetched_at > NOW() - INTERVAL 1 HOUR;

-- ============================================
-- 4. 클러스터 요약이 없는 클러스터 ID 목록
-- ============================================
SELECT DISTINCT n.dup_cluster_id as '요약필요한_클러스터ID'
FROM news n
LEFT JOIN news_cluster c ON n.dup_cluster_id = c.id
WHERE n.fetched_at > NOW() - INTERVAL 1 HOUR
  AND n.dup_cluster_id IS NOT NULL
  AND (c.cluster_summary IS NULL OR TRIM(c.cluster_summary) = '')
ORDER BY n.dup_cluster_id;
