package com.fullStc.support.repository;

import com.fullStc.support.domain.QaHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Q&A 히스토리 Repository
 */
public interface QaHistoryRepository extends JpaRepository<QaHistory, Long> {

    /**
     * 사용자 ID로 Q&A 히스토리 조회 (최신순)
     */
    List<QaHistory> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 세션 ID로 Q&A 히스토리 조회 (생성순)
     */
    List<QaHistory> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    /**
     * 사용자 ID와 세션 ID로 Q&A 히스토리 조회
     */
    List<QaHistory> findByUserIdAndSessionIdOrderByCreatedAtAsc(Long userId, String sessionId);
}
