package com.fullStc.member.service;

import com.fullStc.member.dto.FindEmailDTO;
import com.fullStc.member.dto.FindPasswordDTO;
import com.fullStc.member.dto.LoginDTO;
import com.fullStc.member.dto.LoginResponseDTO;
import com.fullStc.member.dto.RefreshTokenRequestDTO;
import com.fullStc.member.dto.ResetPasswordDTO;
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
    
    // 아이디 찾기 (닉네임으로 이메일 찾기)
    String findEmail(FindEmailDTO findEmailDTO);
    
    // 비밀번호 찾기 (재설정 토큰 생성 및 반환)
    String requestPasswordReset(FindPasswordDTO findPasswordDTO);
    
    // 비밀번호 재설정 (토큰으로 비밀번호 변경)
    void resetPassword(ResetPasswordDTO resetPasswordDTO);
}
