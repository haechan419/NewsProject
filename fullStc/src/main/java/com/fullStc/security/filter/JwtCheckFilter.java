package com.fullStc.security.filter;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fullStc.member.dto.MemberDTO;
import com.fullStc.util.JwtUtil;
import com.google.gson.Gson;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// JWT 토큰 검증 필터
@Slf4j
@RequiredArgsConstructor
public class JwtCheckFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // 1. Preflight 요청(OPTIONS)은 체크하지 않음
        if (request.getMethod().equals("OPTIONS")) {
            return true;
        }

        // 2. [중요] 경로 변수 선언을 가장 먼저 수행
        String path = request.getRequestURI();
        log.info("check uri.......................{}", path);

        // 3. 예외 경로 설정 (토큰 검사 건너뛰기)

        // 관리자 관련 API (테스트용)
        if (path.startsWith("/admin/")) {
            return true;
        }

        // /api/auth/ 경로 (로그인, 회원가입 등) - 단, 로그아웃은 제외
        if (path.startsWith("/api/auth/") && !path.equals("/api/auth/logout")) {
            return true;
        }

        // 얼굴 인식 API (로그인 전 사용)
        if (path.equals("/api/ai/face/recognize")) {
            return true;
        }

        // OAuth2 인증 경로
        if (path.startsWith("/oauth2/") || path.startsWith("/login/oauth2/")) {
            return true;
        }

        // 로그인 페이지 및 리다이렉트 경로
        if (path.equals("/login") || path.startsWith("/login?")) {
            return true;
        }

        // Swagger UI 및 API 문서 경로
        if (path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs")
                || path.equals("/swagger-ui.html")) {
            return true;
        }

        // 이미지 조회 등 공개 리소스
        if (path.startsWith("/api/products/view/") || path.startsWith("/static/") || path.startsWith("/favicon.ico")) {
            return true;
        }

        // 위 조건에 해당하지 않으면 필터(토큰 검사) 실행
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        log.info("------------------------JwtCheckFilter------------------");

        try {
            // 토큰 추출
            String accessToken = extractAccessToken(request);

            // 토큰 검증 및 인증 설정
            validateAndSetAuthentication(accessToken);

            // 다음 필터로 진행
            filterChain.doFilter(request, response);

        } catch (IllegalArgumentException e) {
            handleJwtException(request, response, e);
        } catch (Exception e) {
            handleJwtException(request, response, e);
        }
    }

    // 요청에서 Access Token 추출 (헤더 -> 쿠키 순서)
    private String extractAccessToken(HttpServletRequest request) {
        String authHeaderStr = request.getHeader("Authorization");

        // 1. Authorization 헤더 확인
        if (authHeaderStr != null && authHeaderStr.startsWith("Bearer ")) {
            String token = authHeaderStr.substring(7);
            log.info("토큰을 Authorization 헤더에서 읽었습니다");
            return token;
        }

        // 2. 쿠키 확인
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    log.info("토큰을 쿠키에서 읽었습니다");
                    return cookie.getValue();
                }
            }
        }

        log.warn("Authorization header와 쿠키 모두에서 토큰을 찾을 수 없습니다");
        throw new IllegalArgumentException("Authorization header or cookie is missing");
    }

    // 토큰 검증 및 SecurityContext 설정
    private void validateAndSetAuthentication(String accessToken) {
        if (accessToken == null || accessToken.isEmpty()) {
            throw new IllegalArgumentException("Token is empty");
        }

        log.info("토큰 검증 시작: token length={}", accessToken.length());

        if (jwtUtil.isTokenExpired(accessToken)) {
            log.warn("토큰이 만료되었습니다");
            throw new IllegalArgumentException("Token expired");
        }

        Map<String, Object> claims = jwtUtil.validateTokenAndGetClaims(accessToken);
        log.info("JWT claims: {}", claims);

        MemberDTO memberDTO = createMemberDTOFromClaims(claims);
        setAuthentication(memberDTO);
    }

    // Claims -> MemberDTO 변환
    private MemberDTO createMemberDTOFromClaims(Map<String, Object> claims) {
        Long id = extractUserIdFromClaims(claims);

        String email = (String) claims.get("email");
        String nickname = (String) claims.get("nickname");
        String provider = (String) claims.get("provider");
        if (provider == null) provider = "local";

        Boolean enabled = (Boolean) claims.get("enabled");
        if (enabled == null) enabled = true;

        @SuppressWarnings("unchecked")
        List<String> roleNames = (List<String>) claims.get("roleNames");
        if (roleNames == null) {
            roleNames = (List<String>) claims.get("roles");
        }

        return MemberDTO.builder()
                .id(id)
                .email(email)
                .password(null)
                .nickname(nickname)
                .provider(provider)
                .enabled(enabled)
                .roleNames(roleNames)
                .build();
    }

    // ID 추출 로직 (id 혹은 sub)
    private Long extractUserIdFromClaims(Map<String, Object> claims) {
        Object idObj = claims.get("id");
        if (idObj != null) return convertToLong(idObj);

        Object subObj = claims.get("sub");
        if (subObj != null) return convertToLong(subObj);

        throw new IllegalArgumentException("JWT 토큰에 사용자 ID가 없습니다");
    }

    // 숫자 형변환 유틸
    private Long convertToLong(Object obj) {
        if (obj instanceof Long) return (Long) obj;
        if (obj instanceof Integer) return ((Integer) obj).longValue();
        if (obj instanceof Number) return ((Number) obj).longValue();
        if (obj instanceof String) {
            try {
                return Long.parseLong((String) obj);
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid user ID format");
            }
        }
        throw new IllegalArgumentException("Cannot convert to Long: " + obj.getClass());
    }

    // SecurityContextHolder에 인증 객체 저장
    private void setAuthentication(MemberDTO memberDTO) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                memberDTO, "", memberDTO.getAuthorities());

        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
    }

    // 예외 발생 시 JSON 응답 반환
    private void handleJwtException(HttpServletRequest request, HttpServletResponse response, Exception e) {
        log.error("JWT 검증 실패: {} (URI: {})", e.getMessage(), request.getRequestURI());

        String errorMessage = getErrorMessage(e);
        String msg = new Gson().toJson(Map.of(
                "error", "ERROR_ACCESS_TOKEN",
                "message", errorMessage
        ));

        try {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            PrintWriter printWriter = response.getWriter();
            printWriter.println(msg);
            printWriter.close();
        } catch (IOException ioException) {
            log.error("응답 작성 중 오류 발생", ioException);
        }
    }

    private String getErrorMessage(Exception e) {
        String message = e.getMessage();
        if (message == null) return "토큰 검증 중 오류가 발생했습니다";

        if (message.contains("expired")) return "토큰이 만료되었습니다";
        if (message.contains("missing") || message.contains("invalid")) return "Authorization 헤더가 없거나 형식이 잘못되었습니다";
        if (message.contains("empty")) return "토큰이 비어있습니다";

        return "토큰 검증 중 오류: " + message;
    }
}