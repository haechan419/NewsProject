package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NewsQualityStoreService {

    private final JdbcTemplate jdbcTemplate;

    public void batchUpdateQuality(List<QualityUpdate> updates) {
        if (updates == null || updates.isEmpty()) return;

        String sql = """
            UPDATE news
            SET dup_cluster_id = ?,
                quality_score = ?,
                risk_flags = CAST(? AS JSON),
                badge = ?,
                verified_at = ?
            WHERE id = ?
        """;

        jdbcTemplate.batchUpdate(sql, updates, 500, (ps, u) -> {
            ps.setObject(1, u.clusterId());
            ps.setObject(2, u.qualityScore());
            ps.setString(3, u.riskFlagsJson()); // "[]", ["NO_EVIDENCE", ...]
            ps.setString(4, u.badge());
            ps.setTimestamp(5, Timestamp.from(u.verifiedAt()));
            ps.setLong(6, u.newsId());
        });
    }

    public record QualityUpdate(
            long newsId,
            Long clusterId,
            Integer qualityScore,
            String riskFlagsJson,
            String badge,
            Instant verifiedAt
    ) {}
}
