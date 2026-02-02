package com.fullStc.support.service;

import com.fullStc.support.dto.InquiryAdminRequest;
import com.fullStc.support.dto.InquiryCreateRequest;
import com.fullStc.support.dto.InquiryResponse;

import java.util.List;

/**
 * 문의 티켓 서비스 인터페이스
 */
public interface InquiryService {

    /**
     * 문의 티켓 생성
     */
    InquiryResponse createInquiry(Long userId, InquiryCreateRequest request);

    /**
     * 문의 티켓 목록 조회 (사용자별)
     */
    List<InquiryResponse> getMyInquiries(Long userId);

    /**
     * 문의 티켓 상세 조회
     */
    InquiryResponse getInquiryById(Long userId, Long inquiryId);

    // ===== 관리자 기능 =====

    /**
     * 전체 문의 티켓 목록 조회
     */
    List<InquiryResponse> getAllInquiries();

    /**
     * 문의 티켓 상세 조회 (관리자용 - 권한 체크 없음)
     */
    InquiryResponse getInquiryByIdForAdmin(Long inquiryId);

    /**
     * 문의 티켓 상태 변경 및 답변 작성
     */
    InquiryResponse updateInquiry(Long inquiryId, InquiryAdminRequest request);
}
