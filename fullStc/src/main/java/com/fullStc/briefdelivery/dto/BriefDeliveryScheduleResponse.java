package com.fullStc.briefdelivery.dto;

import lombok.*;

import java.time.Instant;

/**
 * 브리핑 배송 예약 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BriefDeliveryScheduleResponse {

    private Long id;
    private Long userId;
    private Instant scheduledAt;
    private String status;
    private Instant createdAt;
}
