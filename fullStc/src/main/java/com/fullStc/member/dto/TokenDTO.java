package com.fullStc.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// JWT 토큰 응답을 위한 DTO
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TokenDTO {
    // Access Token (1일 유효)
    private String accessToken;

    // Refresh Token (7일 유효)
    private String refreshToken;

    // 토큰 타입 (Bearer)
    @Builder.Default
    private String tokenType = "Bearer";
}
