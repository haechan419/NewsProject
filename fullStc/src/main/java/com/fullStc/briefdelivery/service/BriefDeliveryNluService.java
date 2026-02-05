package com.fullStc.briefdelivery.service;

import com.fullStc.briefdelivery.dto.BriefDeliveryAnalyzeResponse;

import java.time.Instant;

/**
 * 브리핑 배송 NLU(의도·배송시간) 분석 서비스 인터페이스
 */
public interface BriefDeliveryNluService {

    /**
     * 텍스트에서 의도와 예약 시각 추출
     */
    BriefDeliveryAnalyzeResponse analyze(String rawText, Long userId);
}
