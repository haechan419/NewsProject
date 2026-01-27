package com.fullStc.member.dto;

import java.util.List;

import com.fullStc.member.domain.enums.NewsCategory;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
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
    // 관심 카테고리 목록 (정치, 경제, 엔터, IT/과학, 스포츠, 국제 중 최대 3개)
    @NotEmpty(message = "최소 1개 이상의 카테고리를 선택해야 합니다")
    @Size(max = 3, message = "관심 카테고리는 최대 3개까지 선택할 수 있습니다")
    private List<String> categories;

    // 카테고리 유효성 검증 (커스텀 검증 메서드)
    public void validateCategories() {
        if (categories == null || categories.isEmpty()) {
            return; // @NotEmpty가 처리
        }

        String[] validCategories = NewsCategory.getAllDisplayNames();
        for (String category : categories) {
            if (category == null || category.trim().isEmpty()) {
                continue;
            }
            boolean isValid = false;
            for (String validCategory : validCategories) {
                if (validCategory.equals(category.trim())) {
                    isValid = true;
                    break;
                }
            }
            if (!isValid) {
                throw new IllegalArgumentException("유효하지 않은 카테고리입니다: " + category + 
                    ". 가능한 카테고리: " + String.join(", ", validCategories));
            }
        }
    }
}
