package com.fullStc.member.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import com.fullStc.member.dto.FaceLoginDTO;
import com.fullStc.member.dto.LoginDTO;
import com.fullStc.member.dto.LoginResponseDTO;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.dto.RefreshTokenRequestDTO;
import com.fullStc.member.dto.SignUpDTO;
import com.fullStc.member.dto.TokenDTO;
import com.fullStc.member.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 인증 관련 컨트롤러
@Tag(name = "인증", description = "인증 관련 API (회원가입, 로그인, 토큰 갱신, 로그아웃)")
@RestController
@RequestMapping("/api/auth")
@Slf4j
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.security.https-enabled:false}")
    private boolean httpsEnabled;

    // 회원가입
    @Operation(summary = "회원가입", description = "새로운 회원을 등록합니다. 이메일과 닉네임은 중복될 수 없습니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "회원가입 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (이메일/닉네임 중복, 유효성 검증 실패)")
    })
    @PostMapping("/signup")
    public ResponseEntity<Long> signUp(@Validated @RequestBody SignUpDTO signUpDTO) {
        log.info("회원가입 요청: email={}", signUpDTO.getEmail());
        Long userId = authService.signUp(signUpDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(userId);
    }

    // 로그인 (JSON 기반, React 및 Swagger에서 사용)
    @Operation(summary = "로그인", description = "이메일과 비밀번호로 로그인하여 JWT 토큰과 사용자 정보를 발급받습니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "로그인 성공"),
            @ApiResponse(responseCode = "401", description = "로그인 실패 (이메일/비밀번호 불일치 또는 계정 비활성화)")
    })
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(
            @Validated @RequestBody LoginDTO loginDTO,
            HttpServletResponse response) {
        log.info("로그인 요청: email={}", loginDTO.getEmail());
        LoginResponseDTO loginResponse = authService.login(loginDTO);

        // Access Token을 HttpOnly 쿠키에 저장
        Cookie accessTokenCookie = new Cookie("accessToken", loginResponse.getToken().getAccessToken());
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(httpsEnabled); // 환경 변수에서 읽기
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(2 * 60 * 60); // 2시간 (초 단위)
        accessTokenCookie.setAttribute("SameSite", "Lax"); // CSRF 방어
        response.addCookie(accessTokenCookie);

        // Refresh Token을 HttpOnly 쿠키에 저장
        Cookie refreshTokenCookie = new Cookie("refreshToken", loginResponse.getToken().getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(httpsEnabled); // 환경 변수에서 읽기
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(60 * 60 * 24 * 7); // 7일 (초 단위) - JWT 만료 시간과 일치
        refreshTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshTokenCookie);

        // 보안: 쿠키에 저장하므로 응답 본문에서 토큰 제거 (사용자 정보만 반환)
        LoginResponseDTO safeResponse = LoginResponseDTO.builder()
                .user(loginResponse.getUser())
                .build();

        return ResponseEntity.ok(safeResponse);
    }

    // 얼굴 로그인
    @Operation(summary = "얼굴 로그인", description = "얼굴 인식 결과를 기반으로 로그인하여 JWT 토큰과 사용자 정보를 발급받습니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "얼굴 로그인 성공"),
            @ApiResponse(responseCode = "400", description = "등록된 사용자를 찾을 수 없거나 계정이 비활성화됨")
    })
    @PostMapping("/face-login")
    public ResponseEntity<LoginResponseDTO> faceLogin(
            @Validated @RequestBody FaceLoginDTO faceLoginDTO,
            HttpServletResponse response) {
        log.info("얼굴 로그인 요청: email={}, matchedUserId={}", faceLoginDTO.getEmail(), faceLoginDTO.getMatchedUserId());
        LoginResponseDTO loginResponse = authService.faceLogin(faceLoginDTO);

        // Access Token을 HttpOnly 쿠키에 저장
        Cookie accessTokenCookie = new Cookie("accessToken", loginResponse.getToken().getAccessToken());
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(httpsEnabled);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(2 * 60 * 60); // 2시간 (초 단위)
        accessTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessTokenCookie);

        // Refresh Token을 HttpOnly 쿠키에 저장
        Cookie refreshTokenCookie = new Cookie("refreshToken", loginResponse.getToken().getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(httpsEnabled);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(60 * 60 * 24 * 7); // 7일 (초 단위)
        refreshTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshTokenCookie);

        // 보안: 쿠키에 저장하므로 응답 본문에서 토큰 제거 (사용자 정보만 반환)
        LoginResponseDTO safeResponse = LoginResponseDTO.builder()
                .user(loginResponse.getUser())
                .build();

        return ResponseEntity.ok(safeResponse);
    }

    // Refresh Token으로 Access Token 갱신
    @Operation(summary = "토큰 갱신", description = "Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "토큰 갱신 성공"),
            @ApiResponse(responseCode = "400", description = "유효하지 않거나 만료된 Refresh Token")
    })
    @PostMapping("/refresh")
    public ResponseEntity<TokenDTO> refreshToken(
            @CookieValue(value = "refreshToken", required = false) String refreshTokenFromCookie,
            @RequestBody(required = false) RefreshTokenRequestDTO refreshTokenRequestDTO,
            HttpServletResponse response) {
        log.info("토큰 갱신 요청");

        // 쿠키에서 refreshToken을 우선 사용, 없으면 요청 본문에서 가져오기
        String refreshToken = refreshTokenFromCookie != null
                ? refreshTokenFromCookie
                : (refreshTokenRequestDTO != null ? refreshTokenRequestDTO.getRefreshToken() : null);

        if (refreshToken == null) {
            throw new RuntimeException("Refresh Token이 없습니다");
        }

        RefreshTokenRequestDTO requestDTO = RefreshTokenRequestDTO.builder()
                .refreshToken(refreshToken)
                .build();

        TokenDTO tokenDTO = authService.refreshToken(requestDTO);

        // 새로운 Access Token을 쿠키에 업데이트
        Cookie accessTokenCookie = new Cookie("accessToken", tokenDTO.getAccessToken());
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(httpsEnabled);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(2 * 60 * 60); // 2시간
        accessTokenCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessTokenCookie);

        // 보안: 쿠키에 저장하므로 응답 본문에서 토큰 제거 (빈 객체 반환)
        return ResponseEntity.ok().build();
    }

    // 로그아웃
    @Operation(summary = "로그아웃", description = "현재 사용자의 모든 Refresh Token을 삭제합니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "로그아웃 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "JWT")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            Authentication authentication,
            HttpServletResponse response) {
        // Authentication이 null인 경우 처리
        if (authentication == null || authentication.getPrincipal() == null) {
            log.warn("로그아웃 실패: 인증 정보가 없습니다");
            throw new RuntimeException("인증되지 않은 사용자입니다");
        }

        // SecurityContext에서 사용자 정보 가져오기
        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();

        log.info("로그아웃 요청: userId={}", userId);
        authService.logout(userId);

        // 쿠키 삭제
        Cookie accessTokenCookie = new Cookie("accessToken", null);
        accessTokenCookie.setHttpOnly(true);
        accessTokenCookie.setSecure(httpsEnabled);
        accessTokenCookie.setPath("/");
        accessTokenCookie.setMaxAge(0);
        response.addCookie(accessTokenCookie);

        Cookie refreshTokenCookie = new Cookie("refreshToken", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(httpsEnabled);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0);
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok().build();
    }
}
