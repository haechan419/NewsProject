package com.fullStc.briefdelivery.dto;

import lombok.*;

import java.time.Instant;

/**
 * 브리핑 배송 의도·시간 분석 응답 (Python NLU 결과)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BriefDeliveryAnalyzeResponse {

    /** 의도 (예: BRIEF_DELIVERY_SUBSCRIBE) */
    private String intent;
    /** 예약 배송 시각 (ISO-8601 또는 null) */
    private Instant scheduledAt;
    /** 사용자에게 보여줄 메시지 */
    private String message;
    /** 예약 등록 여부 (서버에서 스케줄 등록했을 때 true) */
    private Boolean scheduled;
}
