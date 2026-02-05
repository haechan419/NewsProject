package com.fullStc.briefdelivery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;

/**
 * 브리핑 배송 예약 등록 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BriefDeliveryScheduleRequest {

    @NotNull(message = "예약 시각은 필수입니다.")
    private Instant scheduledAt;
}
