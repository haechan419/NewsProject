package com.fullStc.security.handler;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class CustomOAuth2FailureHandler extends SimpleUrlAuthenticationFailureHandler {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
            AuthenticationException exception) throws IOException, ServletException {
        log.error("OAuth2 로그인 실패: {}", exception.getMessage(), exception);
        
        // 예외 원인 분석
        String errorType = determineErrorType(exception);
        log.info("OAuth2 에러 타입: {}", errorType);
        
        // 프론트엔드 로그인 페이지로 리다이렉트 (에러 타입 포함)
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=" + errorType);
    }
    
    /**
     * 예외 원인을 분석하여 에러 타입 결정
     */
    private String determineErrorType(AuthenticationException exception) {
        String message = exception.getMessage();
        Throwable cause = exception.getCause();
        
        // 429 Too Many Requests 에러 확인
        if (cause != null) {
            // HttpClientErrorException 확인
            if (cause instanceof HttpClientErrorException) {
                HttpClientErrorException httpException = (HttpClientErrorException) cause;
                if (httpException.getStatusCode().value() == 429) {
                    log.warn("카카오 API 요청 제한 초과 (429 Too Many Requests)");
                    return "oauth_rate_limit";
                }
            }
            
            // 중첩된 예외 확인
            Throwable nestedCause = cause.getCause();
            if (nestedCause instanceof HttpClientErrorException) {
                HttpClientErrorException httpException = (HttpClientErrorException) nestedCause;
                if (httpException.getStatusCode().value() == 429) {
                    log.warn("카카오 API 요청 제한 초과 (429 Too Many Requests)");
                    return "oauth_rate_limit";
                }
            }
        }
        
        // 메시지에서 에러 코드 확인
        if (message != null) {
            if (message.contains("KOE237") || 
                message.contains("rate limit") || 
                message.contains("TooManyRequests") ||
                message.contains("429") ||
                message.contains("최대 재시도 횟수 초과")) {
                log.warn("카카오 API 요청 제한 초과 감지: {}", message);
                return "oauth_rate_limit";
            }
            if (message.contains("invalid_request") || message.contains("invalid_grant")) {
                return "oauth_invalid";
            }
            if (message.contains("access_denied")) {
                return "oauth_denied";
            }
        }
        
        // 기본 에러 타입
        return "oauth_failed";
    }
}
