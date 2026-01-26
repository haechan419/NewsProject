package com.fullStc.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 아이디 찾기 요청을 위한 DTO
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FindEmailDTO {
    // 닉네임 (필수, 최소 2자, 최대 20자)
    @NotBlank(message = "닉네임은 필수입니다")
    @Size(min = 2, max = 20, message = "닉네임은 2자 이상 20자 이하여야 합니다")
    private String nickname;
}
