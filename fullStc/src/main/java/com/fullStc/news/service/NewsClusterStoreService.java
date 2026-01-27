package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NewsClusterStoreService {

    private final JdbcTemplate jdbc;

    /**
     * cluster_key 기준 upsert 후 cluster id 반환
     * - null 값은 기존 값 유지 (COALESCE)
     * - updated_at은 항상 NOW()
     * - 동시성으로 INSERT 충돌 시 DuplicateKeyException 처리 후 id 조회로 복구
     */
    public long upsertCluster(String clusterKey,
                              String category,
                              Long repNewsId,
                              String title,
                              Integer score,
                              String flagsJson,
                              String badge) {

        // 1) 존재하면 업데이트
        String update = """
            UPDATE news_cluster
            SET category = COALESCE(?, category),
                representative_news_id = COALESCE(?, representative_news_id),
                cluster_title = COALESCE(?, cluster_title),
                quality_score = COALESCE(?, quality_score),
                risk_flags = COALESCE(CAST(? AS JSON), risk_flags),
                badge = COALESCE(?, badge),
                updated_at = NOW()
            WHERE cluster_key = ?
        """;
        int updated = jdbc.update(update, category, repNewsId, title, score, flagsJson, badge, clusterKey);

        if (updated > 0) return getIdByKey(clusterKey);

        // 2) 없으면 insert (동시성 대비)
        String insert = """
            INSERT INTO news_cluster
            (cluster_key, category, representative_news_id, cluster_title, quality_score, risk_flags, badge, created_at, updated_at)
            VALUES
            (?, ?, ?, ?, ?, CAST(? AS JSON), ?, NOW(), NOW())
        """;
        try {
            jdbc.update(insert, clusterKey, category, repNewsId, title, score, flagsJson, badge);
        } catch (DuplicateKeyException e) {
            // 다른 스레드/요청이 먼저 insert한 케이스 -> 그냥 id 조회해서 반환
        }

        return getIdByKey(clusterKey);
    }

    private long getIdByKey(String clusterKey) {
        Long id = jdbc.queryForObject(
                "SELECT id FROM news_cluster WHERE cluster_key = ?",
                Long.class,
                clusterKey
        );
        if (id == null) throw new IllegalStateException("cluster_key exists but id not found: " + clusterKey);
        return id;
    }
}
