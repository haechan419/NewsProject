package com.fullStc.briefdelivery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * 브리핑 배송 의도·시간 분석 요청 (텍스트)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BriefDeliveryAnalyzeRequest {

    @NotNull(message = "텍스트는 필수입니다.")
    private String rawText;

    @NotNull(message = "사용자 ID는 필수입니다.")
    private Long userId;
}
