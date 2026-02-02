package com.fullStc.mainpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 메인페이지 통합 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MainPageResponseDTO {
    // 카테고리별 인기 뉴스 (각 카테고리 1개씩)
    private List<MainPageNewsDTO> popularNewsByCategory;
    
    // 사용자 관심 카테고리 목록
    private List<String> userCategories;
    
    // 선택된 카테고리의 인기 뉴스 (영상 추가 예정)
    private MainPageNewsDTO topNewsForSelectedCategory;
    
    // 사용자 관심 카테고리별 뉴스 목록
    private List<MainPageNewsDTO> newsByUserCategories;
}
