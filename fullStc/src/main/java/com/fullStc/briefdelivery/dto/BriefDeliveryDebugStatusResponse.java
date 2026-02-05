package com.fullStc.briefdelivery.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

/**
 * 브라우저에서 확인 가능한 디버그/상태 조회 응답
 */
@Getter
@Builder
public class BriefDeliveryDebugStatusResponse {
    private Long scheduleId;
    private Long userId;
    private Instant scheduledAt;
    private String status;
    private Instant createdAt;
    private Instant lastAttemptAt;
    private Instant completedAt;
    private String errorMessage;
}

