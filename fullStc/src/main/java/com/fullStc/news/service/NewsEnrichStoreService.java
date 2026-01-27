package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class NewsEnrichStoreService {

    private final JdbcTemplate jdbc; // ★ JPA Repository 쓰지 마세요!

    public void markAttempt(Long id, Instant now) {
        jdbc.update("UPDATE news SET content_extracted_at = ? WHERE id = ?",
                Timestamp.from(now), id);
    }

    // ★ [핵심] Native Query로 딱 필요한 컬럼만 0.001초 만에 수정 (락 최소화)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveContent(Long newsId, String content, Instant now) {
        jdbc.update("""
            UPDATE news
            SET content = ?, 
                content_extracted_at = ?
            WHERE id = ?
        """, content, Timestamp.from(now), newsId);
    }
}