package com.fullStc.support.service;

import com.fullStc.support.domain.FaqCategory;
import com.fullStc.support.dto.FaqRequest;
import com.fullStc.support.dto.FaqResponse;

import java.util.List;

/**
 * FAQ 서비스 인터페이스
 */
public interface FaqService {

    /**
     * FAQ 목록 조회 (전체)
     */
    List<FaqResponse> getAllFaqs();

    /**
     * FAQ 목록 조회 (카테고리별)
     */
    List<FaqResponse> getFaqsByCategory(FaqCategory category);

    /**
     * FAQ 상세 조회
     */
    FaqResponse getFaqById(Long id);

    /**
     * FAQ 검색
     */
    List<FaqResponse> searchFaqs(String keyword, FaqCategory category);

    /**
     * FAQ 버튼 클릭 (조회수 증가 후 응답)
     */
    FaqResponse clickFaq(Long id);

    /**
     * FAQ 카테고리 목록 조회
     */
    List<FaqCategory> getCategories();

    // ===== 관리자 기능 =====

    /**
     * FAQ 생성
     */
    FaqResponse createFaq(FaqRequest request);

    /**
     * FAQ 수정
     */
    FaqResponse updateFaq(Long id, FaqRequest request);

    /**
     * FAQ 삭제
     */
    void deleteFaq(Long id);
}
