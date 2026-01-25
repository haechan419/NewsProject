package com.fullStc.member.service;

import com.fullStc.member.dto.LoginDTO;
import com.fullStc.member.dto.LoginResponseDTO;
import com.fullStc.member.dto.RefreshTokenRequestDTO;
import com.fullStc.member.dto.SignUpDTO;
import com.fullStc.member.dto.TokenDTO;

// 인증 관련 서비스 인터페이스
public interface AuthService {
    
    // 회원가입
    Long signUp(SignUpDTO signUpDTO);
    
    // 로그인
    LoginResponseDTO login(LoginDTO loginDTO);
    
    // Refresh Token으로 Access Token 갱신
    TokenDTO refreshToken(RefreshTokenRequestDTO refreshTokenRequestDTO);
    
    // 로그아웃 (Refresh Token 삭제)
    void logout(Long userId);
}
