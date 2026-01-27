package com.fullStc.member.service;

import java.util.List;

import com.fullStc.member.dto.CategoryUpdateDTO;

// 카테고리 관련 서비스 인터페이스
public interface CategoryService {
    
    // 카테고리 목록 조회
    List<String> getAllCategories();
    
    // 사용자 관심 카테고리 조회
    List<String> getUserCategories(Long userId);
    
    // 사용자 관심 카테고리 업데이트
    void updateUserCategories(Long userId, CategoryUpdateDTO categoryUpdateDTO);
}
