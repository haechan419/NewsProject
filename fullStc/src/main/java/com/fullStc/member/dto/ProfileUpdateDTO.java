package com.fullStc.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 프로필 업데이트 요청을 위한 DTO
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileUpdateDTO {
    // 닉네임 (2-20자, 한글/영문/숫자만 허용)
    @NotBlank(message = "닉네임을 입력해주세요")
    @Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다")
    @Pattern(regexp = "^[가-힣a-zA-Z0-9]+$", message = "닉네임은 한글, 영문, 숫자만 사용할 수 있습니다")
    private String nickname;
}
