package com.fullStc.config;

import com.fullStc.exchange.exception.ExchangeRateException;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

// 전역 예외 핸들러
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 유효성 검증 오류 처리
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null
                                ? error.getDefaultMessage()
                                : "유효성 검증 실패",
                        (existing, replacement) -> existing));

        Map<String, Object> response = new HashMap<>();
        response.put("error", "VALIDATION_ERROR");
        response.put("message", "입력값 검증에 실패했습니다");
        response.put("errors", errors);

        log.warn("유효성 검증 실패: {}", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // IllegalArgumentException 처리 (잘못된 인자 오류)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("IllegalArgumentException 발생: {}", ex.getMessage());

        Map<String, Object> response = new HashMap<>();
        String message = ex.getMessage() != null ? ex.getMessage() : "잘못된 요청입니다";

        response.put("error", "ERROR_BAD_REQUEST");
        response.put("message", message);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // ExchangeRateException 처리 (환율 API 오류)
    @ExceptionHandler(ExchangeRateException.class)
    public ResponseEntity<Map<String, Object>> handleExchangeRateException(ExchangeRateException ex) {
        log.error("ExchangeRateException 발생: {}", ex.getMessage(), ex);

        Map<String, Object> response = new HashMap<>();
        String message = ex.getMessage() != null ? ex.getMessage() : "환율 정보 조회 중 오류가 발생했습니다";

        response.put("error", "ERROR_EXCHANGE_RATE");
        response.put("message", message);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // RuntimeException 처리 (로그인 실패 등)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.error("RuntimeException 발생: {}", ex.getMessage(), ex);

        Map<String, Object> response = new HashMap<>();
        String message = ex.getMessage() != null ? ex.getMessage() : "서버 오류가 발생했습니다";

        // 아이디/비밀번호 찾기 관련 오류인 경우 (400 Bad Request)
        if (message.contains("닉네임으로 등록된 회원을 찾을 수 없습니다") ||
                message.contains("이메일로 등록된 회원을 찾을 수 없습니다") ||
                message.contains("소셜 로그인 계정은 이메일 찾기를 사용할 수 없습니다") ||
                message.contains("소셜 로그인 계정은 비밀번호 재설정을 사용할 수 없습니다") ||
                message.contains("유효하지 않은 토큰입니다") ||
                message.contains("만료된 토큰입니다") ||
                message.contains("이미 사용된 토큰입니다")) {
            response.put("error", "ERROR_NOT_FOUND");
            response.put("message", message);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // 로그인 관련 오류인 경우 (401 Unauthorized)
        if (message.contains("비밀번호가 일치하지 않습니다") ||
                message.contains("비활성화된 계정")) {
            response.put("error", "ERROR_LOGIN");
            response.put("message", "이메일 또는 비밀번호가 올바르지 않습니다");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // 기타 RuntimeException
        response.put("error", "ERROR_SERVER");
        response.put("message", message);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    // NoResourceFoundException 처리 (정적 리소스 파일 없음)
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<?> handleNoResourceFoundException(NoResourceFoundException ex, HttpServletRequest request) {
        String requestURI = request.getRequestURI();

        // 정적 리소스 경로(/upload/)에 대한 예외는 Spring의 기본 404 처리에 맡김
        if (requestURI != null && requestURI.startsWith("/upload/")) {
            log.warn("정적 리소스 파일을 찾을 수 없음: {}", requestURI);
            // 404 응답 반환 (JSON이 아닌 일반 404)
            return ResponseEntity.notFound().build();
        }

        // 기타 리소스는 JSON 에러 응답
        log.error("리소스를 찾을 수 없음: {}", requestURI);
        Map<String, Object> response = new HashMap<>();
        response.put("error", "ERROR_NOT_FOUND");
        response.put("message", "요청한 리소스를 찾을 수 없습니다");

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    // 일반 예외 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex, HttpServletRequest request) {
        String requestURI = request.getRequestURI();

        // 정적 리소스 경로(/upload/)에 대한 예외는 처리하지 않음
        if (requestURI != null && requestURI.startsWith("/upload/")) {
            log.warn("정적 리소스 요청 예외는 무시: {}", requestURI);
            // Spring의 기본 404 처리에 맡김
            return ResponseEntity.notFound().build();
        }

        log.error("예외 발생: {}", ex.getMessage(), ex);

        Map<String, Object> response = new HashMap<>();
        response.put("error", "ERROR_SERVER");
        response.put("message", "서버 오류가 발생했습니다");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
