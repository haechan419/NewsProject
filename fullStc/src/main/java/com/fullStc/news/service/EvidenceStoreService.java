package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EvidenceStoreService {
    private final JdbcTemplate jdbc;

    public void deleteByNewsId(long newsId) {
        jdbc.update("DELETE FROM news_summary_evidence WHERE news_id = ?", newsId);
    }

    public void batchInsert(List<EvidenceRow> rows) {
        if (rows.isEmpty()) return;
        String sql = """
          INSERT INTO news_summary_evidence
          (news_id, sentence_idx, sentence_text, evidence_text, evidence_score, verdict)
          VALUES (?, ?, ?, ?, ?, ?)
        """;
        jdbc.batchUpdate(sql, rows, 500, (ps, r) -> {
            ps.setLong(1, r.newsId());
            ps.setInt(2, r.sentenceIdx());
            ps.setString(3, r.sentenceText());
            ps.setString(4, r.evidenceText());
            ps.setObject(5, r.evidenceScore());
            ps.setString(6, r.verdict());
        });
    }

    public record EvidenceRow(long newsId, int sentenceIdx, String sentenceText,
                              String evidenceText, Double evidenceScore, String verdict) {}
}
