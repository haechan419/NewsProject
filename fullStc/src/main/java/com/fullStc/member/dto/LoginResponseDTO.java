package com.fullStc.member.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 로그인 응답을 위한 DTO (토큰 + 사용자 정보)
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDTO {
    // JWT 토큰 정보
    private TokenDTO token;
    
    // 사용자 정보 (비밀번호 제외)
    private UserInfoDTO user;
    
    // 사용자 정보를 위한 내부 DTO
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserInfoDTO {
        private Long id;
        private String email;
        private String nickname;
        private String provider;
        private boolean enabled;
        private java.util.List<String> roleNames;
        private java.util.List<String> categories;
    }
}
