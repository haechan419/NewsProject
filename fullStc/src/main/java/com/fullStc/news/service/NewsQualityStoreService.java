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

        // [수정됨] CAST(? AS JSON) 제거하고 그냥 물음표(?)로 바꿨습니다.
        String sql = """
            UPDATE news
            SET dup_cluster_id = ?,
                quality_score = ?,
                risk_flags = ?, 
                badge = ?,
                verified_at = ?
            WHERE id = ?
        """;

        jdbcTemplate.batchUpdate(sql, updates, 500, (ps, u) -> {
            ps.setObject(1, u.clusterId());
            ps.setObject(2, u.qualityScore());
            ps.setString(3, u.riskFlagsJson()); // 그냥 문자열로 넣으면 DB가 알아서 JSON으로 받습니다.
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
