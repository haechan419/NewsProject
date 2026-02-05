package com.fullStc.briefdelivery.service;

import com.fullStc.briefdelivery.dto.BriefDeliveryScheduleRequest;
import com.fullStc.briefdelivery.dto.BriefDeliveryScheduleResponse;
import com.fullStc.briefdelivery.entity.BriefDeliverySchedule;

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
}
