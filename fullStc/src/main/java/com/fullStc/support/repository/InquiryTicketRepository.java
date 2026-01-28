package com.fullStc.support.repository;

import com.fullStc.support.domain.InquiryStatus;
import com.fullStc.support.domain.InquiryTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 문의 티켓 Repository
 */
public interface InquiryTicketRepository extends JpaRepository<InquiryTicket, Long> {

    /**
     * 사용자 ID로 문의 목록 조회 (최신순)
     */
    List<InquiryTicket> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 상태별 문의 목록 조회 (최신순)
     */
    List<InquiryTicket> findByStatusOrderByCreatedAtDesc(InquiryStatus status);

    /**
     * 전체 문의 목록 조회 (최신순) - 관리자용
     */
    List<InquiryTicket> findAllByOrderByCreatedAtDesc();

    /**
     * 사용자 ID와 상태로 문의 목록 조회
     */
    List<InquiryTicket> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, InquiryStatus status);
}
