package com.fullStc.market.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 금융 데이터 수집 스케줄러
 * 5~30초 주기로 외부 API 호출하여 데이터 수집
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MarketDataScheduler {

    private final MarketDataAggregatorService aggregatorService;
    
    @Value("${market.scheduler.enabled:true}")
    private boolean schedulerEnabled;
    
    @Value("${market.scheduler.interval:15000}")
    private long interval; // 기본 15초
    
    /**
     * 시장 데이터 자동 수집
     * fixedDelay: 이전 작업 완료 후 지정된 시간만큼 대기 후 실행
     */
    @Scheduled(fixedDelayString = "${market.scheduler.interval:15000}")
    public void collectMarketData() {
        if (!schedulerEnabled) {
            return;
        }
        
        try {
            log.debug("시장 데이터 자동 수집 시작 (주기: {}ms)", interval);
            aggregatorService.collectAndCacheMarketData();
            log.debug("시장 데이터 자동 수집 완료");
        } catch (Exception e) {
            log.error("시장 데이터 자동 수집 실패", e);
        }
    }
}
