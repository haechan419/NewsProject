package com.fullStc.member.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Refresh Token 갱신 요청을 위한 DTO
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RefreshTokenRequestDTO {
    // Refresh Token (필수)
    @NotBlank(message = "Refresh Token은 필수입니다")
    private String refreshToken;
}
