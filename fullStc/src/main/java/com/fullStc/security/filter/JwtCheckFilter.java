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
        // Preflight 요청은 체크하지 않음
        if (request.getMethod().equals("OPTIONS")) {
            return true;
        }

        // 경로 변수 선언을 가장 먼저 수행
        String path = request.getRequestURI();
        log.info("check uri.......................{}", path);

        // 예외 경로 설정 (토큰 검사 건너뛰기)

        // 관리자 관련 API (테스트용)
        if (path.startsWith("/admin/")) {
            return true;
        }

        // /api/auth/ 경로의 호출은 체크하지 않음 (로그인, 회원가입 등)
        // 단, 로그아웃(/api/auth/logout)은 인증이 필요하므로 필터링함
        if (path.startsWith("/api/auth/") && !path.equals("/api/auth/logout")) {
            return true;
        }

        // 얼굴 인식 API는 체크하지 않음 (로그인 페이지에서 사용)
        if (path.equals("/api/ai/face/recognize")) {
            return true;
        }

        // 카테고리 목록 조회 API는 체크하지 않음 (회원가입 페이지에서 사용)
        if (path.equals("/api/category/list") && "GET".equals(request.getMethod())) {
            return true;
        }

        // 금융 시장 데이터 API는 체크하지 않음 (메인 페이지에서 사용)
        if (path.startsWith("/api/market/")) {
            return true;
        }

        // OAuth2 경로는 체크하지 않음 (OAuth2 인증 플로우)
        if (path.startsWith("/oauth2/") || path.startsWith("/login/oauth2/")) {
            return true;
        }

        // /login 경로는 체크하지 않음 (OAuth2 에러 리다이렉트용)
        if (path.equals("/login") || path.startsWith("/login?")) {
            return true;
        }

        // Swagger UI 경로는 체크하지 않음
        if (path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs") // /v3/api-docs 또는 /v3/api-docs/ 모두 포함
                || path.equals("/swagger-ui.html")
                || path.equals("/v3/api-docs")) { // 정확히 /v3/api-docs인 경우도 추가
            return true;
        }

        // 이미지 조회 경로는 체크하지 않음 (필요시 추가)
        if (path.startsWith("/api/products/view/") || path.startsWith("/static/") || path.startsWith("/favicon.ico")) {
            return true;
        }

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

    // 요청에서 Access Token 추출 (헤더 또는 쿠키)
    private String extractAccessToken(HttpServletRequest request) {
        String authHeaderStr = request.getHeader("Authorization");

        // 1. Authorization 헤더에서 토큰 읽기 (우선순위 1)
        if (authHeaderStr != null && authHeaderStr.startsWith("Bearer ")) {
            String token = authHeaderStr.substring(7);
            log.info("토큰을 Authorization 헤더에서 읽었습니다");
            return token;
        }

        // 2. 쿠키에서 토큰 읽기 (우선순위 2)
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            log.debug("요청된 쿠키 개수: {}", cookies.length);
            for (Cookie cookie : cookies) {
                log.debug("쿠키 이름: {}, 값 길이: {}", cookie.getName(),
                        cookie.getValue() != null ? cookie.getValue().length() : 0);
                if ("accessToken".equals(cookie.getName())) {
                    log.info("토큰을 쿠키에서 읽었습니다");
                    return cookie.getValue();
                }
            }
        } else {
            log.debug("요청에 쿠키가 없습니다");
        }

        log.warn("Authorization header와 쿠키 모두에서 토큰을 찾을 수 없습니다");
        log.warn("요청 URI: {}, 메서드: {}", request.getRequestURI(), request.getMethod());
        throw new IllegalArgumentException("Authorization header or cookie is missing");
    }

    // 토큰 검증 및 인증 설정
    private void validateAndSetAuthentication(String accessToken) {
        if (accessToken == null || accessToken.isEmpty()) {
            throw new IllegalArgumentException("Token is empty");
        }

        log.info("토큰 검증 시작: token length={}", accessToken.length());

        // 토큰 만료 여부 먼저 확인
        if (jwtUtil.isTokenExpired(accessToken)) {
            log.warn("토큰이 만료되었습니다");
            throw new IllegalArgumentException("Token expired");
        }

        // Claims 추출 및 검증
        Map<String, Object> claims = jwtUtil.validateTokenAndGetClaims(accessToken);
        log.info("JWT claims: {}", claims);

        // MemberDTO 생성 및 인증 설정
        MemberDTO memberDTO = createMemberDTOFromClaims(claims);
        setAuthentication(memberDTO);
    }

    // Claims에서 MemberDTO 생성
    private MemberDTO createMemberDTOFromClaims(Map<String, Object> claims) {
        Long id = extractUserIdFromClaims(claims);

        String email = (String) claims.get("email");
        String nickname = (String) claims.get("nickname");
        String provider = (String) claims.get("provider");
        if (provider == null) {
            provider = "local";
        }

        Boolean enabled = (Boolean) claims.get("enabled");
        if (enabled == null) {
            enabled = true;
        }

        @SuppressWarnings("unchecked")
        List<String> roleNames = (List<String>) claims.get("roleNames");
        if (roleNames == null) {
            roleNames = (List<String>) claims.get("roles");
        }

        return MemberDTO.builder()
                .id(id)
                .email(email)
                .password(null) // 보안: JWT에 password 저장하지 않음
                .nickname(nickname)
                .provider(provider)
                .enabled(enabled)
                .roleNames(roleNames)
                .build();
    }

    // Claims에서 사용자 ID 추출
    private Long extractUserIdFromClaims(Map<String, Object> claims) {
        // id 필드에서 추출 시도
        Object idObj = claims.get("id");
        if (idObj != null) {
            return convertToLong(idObj);
        }

        // sub (subject) 필드에서 추출 시도
        Object subObj = claims.get("sub");
        if (subObj != null) {
            return convertToLong(subObj);
        }

        log.error("JWT claims에서 ID를 추출할 수 없습니다. claims: {}", claims);
        throw new IllegalArgumentException("JWT 토큰에 사용자 ID가 없습니다");
    }

    // 객체를 Long으로 변환
    private Long convertToLong(Object obj) {
        if (obj instanceof Long) {
            return (Long) obj;
        } else if (obj instanceof Integer) {
            return ((Integer) obj).longValue();
        } else if (obj instanceof Number) {
            return ((Number) obj).longValue();
        } else if (obj instanceof String) {
            try {
                return Long.parseLong((String) obj);
            } catch (NumberFormatException e) {
                log.warn("필드를 Long으로 변환할 수 없습니다: {}", obj);
                throw new IllegalArgumentException("Invalid user ID format");
            }
        }
        throw new IllegalArgumentException("Cannot convert to Long: " + obj.getClass());
    }

    // SecurityContext에 인증 정보 설정
    private void setAuthentication(MemberDTO memberDTO) {
        log.info("-----------------------------------");
        log.info("memberDTO: {}", memberDTO);
        log.info("authorities: {}", memberDTO.getAuthorities());

        // 보안: password 대신 빈 문자열 사용 (JWT에 password 저장하지 않음)
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                memberDTO, "", memberDTO.getAuthorities());

        SecurityContextHolder.getContext().setAuthentication(authenticationToken);
    }

    // JWT 예외 처리 및 응답
    private void handleJwtException(HttpServletRequest request, HttpServletResponse response, Exception e) {
        log.error("JWT 검증 실패: {}", e.getMessage());
        log.error("요청 경로: {}", request.getRequestURI());

        if (e instanceof IllegalArgumentException) {
            log.error("IllegalArgumentException 발생");
        } else {
            log.error("예외 발생", e);
        }

        String errorMessage = getErrorMessage(e);
        String msg = new Gson().toJson(Map.of(
                "error", "ERROR_ACCESS_TOKEN",
                "message", errorMessage));

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

    // 예외 메시지에서 사용자 친화적인 에러 메시지 생성
    private String getErrorMessage(Exception e) {
        String message = e.getMessage();
        if (message == null) {
            return "토큰 검증 중 오류가 발생했습니다";
        }

        if (message.contains("expired")) {
            return "토큰이 만료되었습니다";
        } else if (message.contains("missing") || message.contains("invalid")) {
            return "Authorization 헤더가 없거나 형식이 잘못되었습니다";
        } else if (message.contains("empty")) {
            return "토큰이 비어있습니다";
        }

        return "토큰 검증 중 오류가 발생했습니다: " + message;
    }
}
