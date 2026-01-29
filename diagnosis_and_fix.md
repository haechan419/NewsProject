# 문제 진단 및 해결 방법

## 문제 원인

`quality_score`, `dup_cluster_id`, `cluster_summary`가 비어있는 이유:

1. **파이프라인 처리 조건 미충족**
   - `content` 또는 `ai_summary`가 있어야 함
   - `embedding`이 있어야 함
   - 이 조건들을 만족해야만 품질 체크가 실행됨

2. **파이프라인이 실행되지 않음**
   - 스케줄러가 2분마다 실행되지만, 새로운 데이터만 처리
   - 기존 데이터는 수동으로 처리해야 함

## 진단 쿼리

### 1. 최근 1시간 데이터 상태 확인

```sql
SELECT 
    n.id,
    n.title,
    -- 필수 조건 체크
    CASE WHEN n.content IS NOT NULL AND TRIM(n.content) <> '' THEN '✅' ELSE '❌' END AS '본문',
    CASE WHEN n.ai_summary IS NOT NULL AND TRIM(n.ai_summary) <> '' THEN '✅' ELSE '❌' END AS 'AI요약',
    CASE WHEN n.embedding IS NOT NULL 
         AND JSON_TYPE(n.embedding) <> 'NULL' 
         AND JSON_LENGTH(n.embedding) > 0 
         THEN '✅' ELSE '❌' END AS '임베딩',
    -- 처리 상태
    n.quality_score AS '점수',
    n.dup_cluster_id AS '클러스터ID',
    c.cluster_summary IS NOT NULL AS '요약여부'
FROM news n
LEFT JOIN news_cluster c ON n.dup_cluster_id = c.id
WHERE n.fetched_at > NOW() - INTERVAL 1 HOUR
ORDER BY n.id DESC;
```

### 2. 처리 가능한 데이터 확인

```sql
-- 파이프라인에서 처리 가능한 데이터 개수
SELECT COUNT(*) as '처리가능'
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
```

## 해결 방법

### 방법 1: 수동으로 파이프라인 실행 (권장)

**API 엔드포인트 호출:**

1. **품질 체크 및 클러스터링 실행:**
   ```
   POST /admin/quality/run?limit=50
   ```

2. **클러스터 요약 생성:**
   ```
   POST /admin/summary/cluster/run?ids=1,2,3&limit=10
   ```
   (클러스터 ID는 위 쿼리로 확인)

### 방법 2: 전체 파이프라인 실행

```
POST /admin/pipeline/run?limit=50
```

### 방법 3: 특정 데이터만 처리

진단 쿼리로 문제가 있는 데이터를 확인한 후, 해당 데이터의 ID를 사용하여 처리할 수 있습니다.

## 체크리스트

- [ ] 최근 1시간 데이터에 `content` 또는 `ai_summary`가 있는가?
- [ ] 최근 1시간 데이터에 `embedding`이 있는가?
- [ ] 파이프라인이 정상적으로 실행되고 있는가? (로그 확인)
- [ ] Python 서비스가 정상 동작하는가? (quality_check.py)
