package com.fullStc.security.handler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.RefreshToken;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.repository.MemberRepository;
import com.fullStc.member.repository.RefreshTokenRepository;
import com.fullStc.util.JwtUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
public class CustomOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

        private final JwtUtil jwtUtil;
        private final MemberRepository memberRepository;
        private final RefreshTokenRepository refreshTokenRepository;

        @Value("${app.frontend.url:http://localhost:5173}")
        private String frontendUrl;

        @Value("${app.security.https-enabled:false}")
        private boolean httpsEnabled;

        @Override
        public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                        Authentication authentication) throws IOException, ServletException {
                log.info("OAuth2 로그인 성공");

                MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
                log.info("인증된 사용자: email={}, nickname={}", memberDTO.getEmail(), memberDTO.getNickname());

                // Member 조회
                Member member = memberRepository.findByEmail(memberDTO.getEmail())
                                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다"));

                // Claims 생성
                Map<String, Object> claims = new HashMap<>();
                claims.put("id", member.getId());
                claims.put("email", member.getEmail());
                claims.put("nickname", member.getNickname());
                claims.put("provider", member.getProvider());
                claims.put("enabled", member.isEnabled());
                claims.put("roleNames", member.getMemberRoleList().stream()
                                .map(role -> role.name())
                                .toList());

                // Access Token 생성 (2시간 = 120분)
                String accessToken = jwtUtil.generateToken(claims, 120);
                // Refresh Token 생성 (7일 = 10080분)
                String refreshToken = jwtUtil.generateToken(claims, 10080);
                // 기존 RefreshToken 삭제(중복 방지)
                refreshTokenRepository.deleteByMemberId(member.getId());

                // Refresh Token을 DB에 저장
                RefreshToken refreshTokenEntity = RefreshToken.builder()
                                .member(member)
                                .token(refreshToken)
                                .expiryDate(LocalDateTime.now().plusDays(7))
                                .build();
                refreshTokenRepository.save(refreshTokenEntity);

                // Access Token을 HttpOnly 쿠키에 저장
                Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
                accessTokenCookie.setHttpOnly(true);
                accessTokenCookie.setSecure(httpsEnabled);
                accessTokenCookie.setPath("/");
                accessTokenCookie.setMaxAge(2 * 60 * 60); // 2시간
                accessTokenCookie.setAttribute("SameSite", "Lax");
                response.addCookie(accessTokenCookie);

                // Refresh Token을 HttpOnly 쿠키에 저장
                Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
                refreshTokenCookie.setHttpOnly(true);
                refreshTokenCookie.setSecure(httpsEnabled);
                refreshTokenCookie.setPath("/");
                refreshTokenCookie.setMaxAge(60 * 60 * 24 * 7); // 7일
                refreshTokenCookie.setAttribute("SameSite", "Lax");
                response.addCookie(refreshTokenCookie);

                log.info("OAuth2 로그인 완료: userId={}, email={}", member.getId(), member.getEmail());

                // 프론트엔드 로그인 페이지로 리다이렉트 (알림 표시 후 홈으로 이동)
                String redirectUrl = frontendUrl + "/login?oauth=success";
                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        }
}