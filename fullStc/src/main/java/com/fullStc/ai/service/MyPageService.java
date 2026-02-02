package com.fullStc.ai.service;
import com.fullStc.ai.dto.MyPageResponseDTO;

public interface MyPageService {
    // 마이페이지 전체 데이터 로드
    MyPageResponseDTO getMyPageData(Long memberId);
    
    // 스크랩 추가/삭제 (토글 방식)
    void toggleScrap(Long memberId, String newsId);
}