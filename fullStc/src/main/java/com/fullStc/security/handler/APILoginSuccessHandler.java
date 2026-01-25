package com.fullStc.security.handler;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.RefreshToken;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.repository.MemberRepository;
import com.fullStc.member.repository.RefreshTokenRepository;
import com.fullStc.util.JwtUtil;
import com.google.gson.Gson;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 로그인 성공 핸들러
@Slf4j
@RequiredArgsConstructor
public class APILoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        log.info("-------------------------------");
        log.info("authentication: {}", authentication);
        log.info("-------------------------------");

        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();

        Map<String, Object> claims = memberDTO.getClaims();

        // Access Token 생성 (60분)
        String accessToken = jwtUtil.generateToken(claims, 60);
        // Refresh Token 생성 (60 * 24 = 1440분 = 1일)
        String refreshToken = jwtUtil.generateToken(claims, 60 * 24);

        // Refresh Token을 DB에 저장
        Member member = memberRepository.findByEmail(memberDTO.getEmail())
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다"));
        
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .member(member)
                .token(refreshToken)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        claims.put("accessToken", accessToken);
        claims.put("refreshToken", refreshToken);

        Gson gson = new Gson();
        String jsonStr = gson.toJson(claims);

        response.setContentType("application/json; charset=UTF-8");
        PrintWriter printWriter = response.getWriter();
        printWriter.println(jsonStr);
        printWriter.close();
    }
}
