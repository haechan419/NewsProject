SELECT 
    n.id AS 'ID',
    n.category AS '카테고리',
    LEFT(n.title, 20) AS '제목(일부)',
    
    -- 1단계: 본문 수집
    CASE 
        WHEN n.content IS NOT NULL THEN '✅본문' 
        ELSE '❌대기' 
    END AS '1_본문',

    -- 2단계: 임베딩
    CASE 
        WHEN n.embedding IS NOT NULL THEN '✅벡터' 
        ELSE '❌대기' 
    END AS '2_임베딩',

    -- 3단계: 품질 점수 (수정: NULL 체크를 먼저 수행)
    CASE 
        WHEN n.quality_score IS NOT NULL THEN CONCAT(n.quality_score, '점')
        ELSE '채점중'
    END AS '3_점수',

    -- 4단계: 클러스터링 (수정: NULL 체크를 먼저 수행)
    CASE 
        WHEN n.dup_cluster_id IS NOT NULL THEN CONCAT('그룹#', n.dup_cluster_id)
        ELSE '묶는중'
    END AS '4_그룹',

    -- 5단계: 요약 상태 (수정: LEFT JOIN으로 인한 NULL 체크 추가)
    CASE 
        WHEN c.cluster_summary IS NOT NULL AND TRIM(c.cluster_summary) <> '' THEN '🎉요약완료'
        WHEN n.dup_cluster_id IS NOT NULL THEN '🤖요약중...'
        ELSE '-'
    END AS '5_최종상태',
    
    n.fetched_at AS '수집시간'

FROM news n
LEFT JOIN news_cluster c ON n.dup_cluster_id = c.id
WHERE n.fetched_at > NOW() - INTERVAL 1 HOUR
ORDER BY n.id DESC;
