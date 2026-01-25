package com.fullStc.member.service;

import com.fullStc.member.dto.CategoryUpdateDTO;
import com.fullStc.member.dto.MemberDTO;

// 사용자 관련 서비스 인터페이스
public interface UserService {
    
    // 사용자 정보 조회
    MemberDTO getUserInfo(Long userId);
    
    // 관심 카테고리 업데이트
    void updateUserCategories(Long userId, CategoryUpdateDTO categoryUpdateDTO);
}
