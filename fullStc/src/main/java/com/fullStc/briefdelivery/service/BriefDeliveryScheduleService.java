package com.fullStc.briefdelivery.service;

import com.fullStc.briefdelivery.dto.BriefDeliveryAnalyzeResponse;
import com.fullStc.briefdelivery.dto.BriefDeliveryDebugStatusResponse;
import com.fullStc.briefdelivery.dto.BriefDeliveryScheduleRequest;
import com.fullStc.briefdelivery.dto.BriefDeliveryScheduleResponse;

import java.util.List;

/**
 * 브리핑 배송 예약 서비스 인터페이스
 */
public interface BriefDeliveryScheduleService {

    /**
     * 1회 예약 등록
     */
    BriefDeliveryScheduleResponse register(Long userId, BriefDeliveryScheduleRequest request);

    /**
     * 실행 시각이 지난 PENDING 예약 처리 (PDF 생성 후 메일 발송)
     */
    void processDueSchedules();

    List<BriefDeliveryScheduleResponse> findByUserId(Long userId);

    /**
     * 사용자별 마지막 예약 디버그 상태 조회 (디버그/운영 확인용)
     */
    BriefDeliveryDebugStatusResponse findLatestDebugStatus(Long userId);

    /**
     * 텍스트 NLU 분석 후 의도가 브리핑 예약이면 예약 등록까지 수행
     */
    BriefDeliveryAnalyzeResponse analyzeAndScheduleFromText(Long userId, String rawText);
}
