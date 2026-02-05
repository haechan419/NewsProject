package com.fullStc.briefdelivery.scheduler;

import com.fullStc.briefdelivery.service.BriefDeliveryScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 브리핑 배송 예약 실행 스케줄러 (주기적으로 도래한 예약 처리)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BriefDeliveryScheduler {

    private final BriefDeliveryScheduleService scheduleService;

    /** 매 분 0초에 실행 시각이 지난 PENDING 예약 처리 */
    @Scheduled(cron = "0 * * * * ?")
    public void processDueSchedules() {
        try {
            scheduleService.processDueSchedules();
        } catch (Exception e) {
            log.error("Brief delivery scheduler error: {}", e.getMessage(), e);
        }
    }
}
