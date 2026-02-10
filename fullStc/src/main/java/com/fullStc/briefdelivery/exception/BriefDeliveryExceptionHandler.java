package com.fullStc.briefdelivery.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * 브리핑 배송 API 전역 예외 처리
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.fullStc.briefdelivery")
public class BriefDeliveryExceptionHandler {

    /**
     * 비즈니스 규칙 위반 (예: 과거 시간 예약)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        log.warn("Brief delivery request rejected: {}", ex.getMessage());
        String path = request.getDescription(false).replace("uri=", "");
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ErrorResponse.of("INVALID_REQUEST", ex.getMessage(), path));
    }

    /**
     * 기타 예외
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        log.error("Brief delivery error: {}", ex.getMessage(), ex);
        String path = request.getDescription(false).replace("uri=", "");
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("INTERNAL_SERVER_ERROR",
                        "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.", path));
    }
}
