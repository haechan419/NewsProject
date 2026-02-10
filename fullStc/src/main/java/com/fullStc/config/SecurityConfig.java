package com.fullStc.config;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fullStc.security.filter.JwtCheckFilter;
import com.fullStc.security.handler.CustomAccessDeniedHandler;
import com.fullStc.security.handler.CustomOAuth2FailureHandler;
import com.fullStc.security.handler.CustomOAuth2SuccessHandler;
import com.fullStc.security.service.CustomOAuth2UserService;
import com.fullStc.util.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// Spring Security 설정
@Configuration
@Slf4j
@RequiredArgsConstructor
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtUtil jwtUtil;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;
    private final CustomOAuth2FailureHandler customOAuth2FailureHandler;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // PasswordEncoder 빈 등록
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // SecurityFilterChain 설정
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        log.info("---------------------security config---------------------------");

        // CORS 설정
        http.cors(httpSecurityCorsConfigurer -> {
            httpSecurityCorsConfigurer.configurationSource(corsConfigurationSource());
        });

        // 세션을 사용하지 않음 (STATELESS)
        http.sessionManagement(sessionConfig -> sessionConfig
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // CSRF 보호 활성화 (Double Submit Cookie 패턴)
        // 쿠키에 CSRF 토큰 저장, 헤더에서 검증
        http.csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
                // GET, HEAD, OPTIONS, TRACE는 CSRF 검증 제외 (안전한 메서드)
                .ignoringRequestMatchers("/api/auth/**",
                        "/api/boards/**",
                        "/api/comments/**",
                        "/api/files/**",
                        "/api/ai/**",
                        "/api/qa/**",  // QA API 경로 추가 !!!!!!!!!!!!
                        "/api/faq/**",
                        "/api/support/**",
                        "/api/inquiry/**",
                        "/api/category/**",
                        "/api/user/**",
<<<<<<< HEAD
                        "/api/market/**",  // 금융 시장 데이터 API
                        "/api/exchange-rate/**",  // 환율 API
                        "/api/drive/**",  // 드라이브 모드 API
                        "/api/images/**",
                        "/briefing/**", // 뉴스 브리핑 조회도 면제하면 안전

=======
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/oauth2/**",
                        "/login/oauth2/**",
                        "/admin/**"));



        // 인가 설정
        http.authorizeHttpRequests(auth -> {
            // Swagger UI 경로는 인증 없이 접근 가능 (정확한 경로 포함)
            auth.requestMatchers(
                    "/swagger-ui/**",
                    "/v3/api-docs", // 정확히 /v3/api-docs
                    "/v3/api-docs/**", // /v3/api-docs/로 시작하는 모든 경로
                    "/swagger-ui.html").permitAll();

            // 정적 리소스 허용 (Swagger UI CSS, favicon 등)
            auth.requestMatchers(
                    "/favicon.ico",
                    "/error",
                    "/static/**",
                    "/public/**",
                    "/resources/**",
                    "/upload/**", // 추가한 부분
                    "/css/**",
                    "/js/**",
                    "/images/**",
                    "/*.ico",
                    "/*.css",
                    "/*.js",
                    "/default-ui.css" // Swagger UI CSS
            ).permitAll();

            // 테스트를 위해 관리자 경로 임시 허용 (추가할 부분)
        auth.requestMatchers("/admin/**").permitAll();

            // 1. AI 마이페이지 관련 경로들을 허용 리스트에 추가합니다.
        auth.requestMatchers("/api/ai/mypage/**").permitAll();
        auth.requestMatchers("/api/ai/video/**").permitAll();
        auth.requestMatchers("/upload/**").permitAll();
<<<<<<< HEAD

            // ▼ [NEW] 이미지 실패 신고 및 뉴스 조회는 로그인 없이 허용
            auth.requestMatchers("/api/images/**").permitAll();
            auth.requestMatchers("/briefing/**").permitAll();

=======
        
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
            // 로그아웃은 인증 필요
            auth.requestMatchers("/api/auth/logout").authenticated();
            // 인증 관련 API는 인증 없이 접근 가능 (로그아웃 제외)
            auth.requestMatchers("/api/auth/**").permitAll();
            auth.requestMatchers("/api/ai/mypage/**").permitAll();
            // 얼굴 인식 API는 인증 없이 접근 가능 (로그인 페이지에서 사용)
            auth.requestMatchers("/api/ai/face/recognize").permitAll();
            // 카테고리 목록 조회 API는 인증 없이 접근 가능 (회원가입 페이지에서 사용)
            auth.requestMatchers("/api/category/list").permitAll();
<<<<<<< HEAD
            // AI 채팅 API는 인증 없이 접근 가능
            auth.requestMatchers("/api/ai/chat", "/api/ai/**").permitAll();
            // 금융 시장 데이터 API는 인증 없이 접근 가능 (메인 페이지에서 사용)
            auth.requestMatchers("/api/market/**").permitAll();
            // 드라이브 모드 API는 인증 없이 접근 가능
            auth.requestMatchers("/api/drive/**").permitAll();
=======
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
            // OAuth2 경로 허용
            auth.requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll();
            // /login 경로 허용 (OAuth2 에러 리다이렉트용)
            auth.requestMatchers("/login").permitAll();
            // 나머지는 인증 필요
            auth.anyRequest().authenticated();
        });

        // Form Login 비활성화 (JWT 기반 REST API이므로 불필요)
        http.formLogin(config -> config.disable());

        // OAuth2 로그인 설정
        http.oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                        .userService(customOAuth2UserService))
                .successHandler(customOAuth2SuccessHandler)
                .failureHandler(customOAuth2FailureHandler));

        // JWT 체크 필터 추가
        http.addFilterBefore(new JwtCheckFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

        // 예외 처리 설정
        http.exceptionHandling(config -> {
            config.accessDeniedHandler(new CustomAccessDeniedHandler());
        });

        // 보안 HTTP 헤더 설정
        http.headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions.deny()) // X-Frame-Options: DENY (클릭재킹 방지)
                .contentTypeOptions(contentTypeOptions -> {
                }) // X-Content-Type-Options: nosniff
                .httpStrictTransportSecurity(hsts -> hsts
                        .maxAgeInSeconds(31536000) // 1년
                ));

        return http.build();
    }

    // CORS 설정 (외부화)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // application.properties에서 허용할 Origin 읽기
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        log.info("CORS 허용 Origin: {}", origins);
        configuration.setAllowedOrigins(origins);

        configuration.setAllowedMethods(Arrays.asList("HEAD", "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type",
                "X-Requested-With", "Cookie", "X-CSRF-TOKEN"));
        configuration.setExposedHeaders(Arrays.asList("Set-Cookie", "X-CSRF-TOKEN"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L); // preflight 요청 캐시 시간 (1시간)

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
