package com.fullStc.member.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 관심 카테고리 업데이트 요청을 위한 DTO
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryUpdateDTO {
    // 관심 카테고리 목록 (엔터테이먼트, 경제, 스포츠, IT/기술, 사회/이슈)
    private List<String> categories;
}
