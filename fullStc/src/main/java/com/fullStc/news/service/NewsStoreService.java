package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import com.fullStc.news.domain.News;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class NewsStoreService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * ✅ NEW-only용 Upsert
     * - 먼저 INSERT 시도 -> 성공하면 (inserted=true, id 반환)
     * - 중복이면 UPDATE 수행 -> (inserted=false)
     */
    public UpsertResult upsertReturningInsert(News n) {
        // 1) INSERT 먼저 시도
        String insertSql = """
            INSERT INTO news
            (source_id, title, summary, url, source_name, provider, category, published_at, fetched_at)
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;

        try {
            KeyHolder kh = new GeneratedKeyHolder();
            int rows = jdbcTemplate.update(conn -> {
                PreparedStatement ps = conn.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, n.getSourceId());
                ps.setString(2, n.getTitle());
                ps.setString(3, n.getSummary());
                ps.setString(4, n.getUrl());
                ps.setString(5, n.getSourceName());
                ps.setString(6, n.getProvider());
                ps.setString(7, n.getCategory());
                ps.setTimestamp(8, ts(n.getPublishedAt()));
                ps.setTimestamp(9, ts(n.getFetchedAt()));
                return ps;
            }, kh);

            if (rows > 0) {
                Number key = kh.getKey();
                long id = (key == null) ? findIdByProviderAndSourceId(n.getProvider(), n.getSourceId()) : key.longValue();
                return new UpsertResult(true, id);
            }
        } catch (DuplicateKeyException dup) {
            // insert 불가 -> 아래 update 수행
        }

        // 2) 중복이면 UPDATE
        String updateSql = """
            UPDATE news
            SET fetched_at   = ?,
                title        = COALESCE(?, title),
                summary      = COALESCE(?, summary),
                url          = COALESCE(?, url),
                source_name  = COALESCE(?, source_name),
                category     = COALESCE(?, category),
                published_at = COALESCE(?, published_at)
            WHERE provider = ? AND source_id = ?
        """;

        jdbcTemplate.update(
                updateSql,
                ts(n.getFetchedAt()),
                n.getTitle(),
                n.getSummary(),
                n.getUrl(),
                n.getSourceName(),
                n.getCategory(),
                ts(n.getPublishedAt()),
                n.getProvider(),
                n.getSourceId()
        );

        long id = findIdByProviderAndSourceId(n.getProvider(), n.getSourceId());
        return new UpsertResult(false, id);
    }

    public long findIdByProviderAndSourceId(String provider, String sourceId) {
        Long id = jdbcTemplate.queryForObject(
                "SELECT id FROM news WHERE provider = ? AND source_id = ? LIMIT 1",
                Long.class,
                provider, sourceId
        );
        if (id == null) throw new IllegalStateException("news row not found after upsert provider=" + provider + " sourceId=" + sourceId);
        return id;
    }

    private Timestamp ts(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }

    public record UpsertResult(boolean inserted, long id) {}
}
