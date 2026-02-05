package com.fullStc.exchange.scheduler;

import com.fullStc.exchange.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

// 환율 데이터 자동 수집 스케줄러 (10초마다 실행, 캐시 TTL 10초)
@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateScheduler {

    private final ExchangeRateService exchangeRateService;

    // 환율 데이터 자동 수집 (10초마다 실행, 캐시 → DB → API 순서로 조회)
    @Scheduled(fixedDelay = 10000) // 10초마다 실행
    public void fetchExchangeRates() {
        try {
            LocalDate today = LocalDate.now();
            log.debug("[환율 스케줄러] 환율 데이터 수집 시작 - 날짜: {}", today);

            // 서비스 호출 (캐시 → DB → API 순서)
            exchangeRateService.getAllExchangeRates();

            log.debug("[환율 스케줄러] 환율 데이터 수집 완료 - 날짜: {}", today);

        } catch (Exception e) {
            log.error("[환율 스케줄러] 환율 데이터 수집 실패", e);
        }
    }
}
