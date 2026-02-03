package com.fullStc.exchange.scheduler;

import com.fullStc.exchange.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * 환율 데이터 자동 수집 스케줄러
 * 한국수출입은행 환율 API를 주기적으로 호출하여 DB에 저장
 * 
 * 주의:
 * - 1분마다 실행되지만, 캐시 TTL이 10분이므로 실제 API 호출은 10분에 한 번 정도만 발생합니다.
 * - 캐시에 있으면 API를 호출하지 않으므로 일일 1000회 제한 내에서 안전하게 동작합니다.
 * - 1분 간격으로 실행하여 실시간처럼 보이게 합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateScheduler {

    private final ExchangeRateService exchangeRateService;

    /**
     * 환율 데이터 자동 수집
     * 서버 시작 후 1분마다 실행 (fixedDelay: 이전 작업 완료 후 1분 대기)
     * 
     * 동작 방식:
     * - 1분마다 서비스를 호출하여 실시간처럼 보이게 합니다.
     * - 서비스 내부에서 캐시(10분 TTL) → DB → API 순서로 조회합니다.
     * - 캐시에 있으면 API를 호출하지 않으므로 실제 API 호출은 10분에 한 번 정도만 발생합니다.
     * - 따라서 일일 1000회 제한 내에서 안전하게 동작합니다.
     * 
     * 계산:
     * - 1분마다 실행 = 하루 1440회 스케줄러 실행
     * - 실제 API 호출 = 10분에 한 번 = 하루 약 144회
     * - 1000회 제한 내에서 충분히 안전합니다.
     */
    @Scheduled(fixedDelay = 60000) // 1분 = 60,000ms (이전 작업 완료 후 1분 대기)
    public void fetchExchangeRates() {
        try {
            LocalDate today = LocalDate.now();
            log.debug("[환율 스케줄러] 환율 데이터 수집 시작 - 날짜: {}", today);

            // 서비스 호출 (캐시 → DB → API 순서로 조회)
            // 캐시에 있으면 API를 호출하지 않으므로 실제 API 호출 횟수는 적습니다.
            exchangeRateService.getAllExchangeRates();

            log.debug("[환율 스케줄러] 환율 데이터 수집 완료 - 날짜: {}", today);

        } catch (Exception e) {
            log.error("[환율 스케줄러] 환율 데이터 수집 실패", e);
        }
    }
}
