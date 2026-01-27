package com.fullStc.member.dto;

import java.util.List;

import com.fullStc.member.domain.enums.NewsCategory;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 회원가입 요청을 위한 DTO
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SignUpDTO {
    // 이메일 (필수, 이메일 형식 검증)
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String email;

    // 비밀번호 (필수, 최소 8자, 영문/숫자/특수문자 포함)
    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$", 
             message = "비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다")
    private String password;

    // 닉네임 (필수, 최소 2자, 최대 20자)
    @NotBlank(message = "닉네임은 필수입니다")
    @Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다")
    private String nickname;

    // 관심 카테고리 목록 (선택사항, 최대 3개) - 정치, 경제, 엔터, IT/과학, 스포츠, 국제 중 선택
    @Size(max = 3, message = "관심 카테고리는 최대 3개까지 선택할 수 있습니다")
    private List<String> categories;

    // 카테고리 유효성 검증 (커스텀 검증 메서드)
    public void validateCategories() {
        if (categories == null || categories.isEmpty()) {
            return; // 선택사항이므로 빈 리스트는 허용
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
