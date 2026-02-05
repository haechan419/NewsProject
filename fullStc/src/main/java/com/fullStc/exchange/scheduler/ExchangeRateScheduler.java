package com.fullStc.exchange.scheduler;

import com.fullStc.exchange.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

// 환율 데이터 자동 수집 스케줄러
// - 일일 기본 데이터: 매일 오전 9시에 API로 수집 (DB 저장)
// - 실시간 데이터: 5초마다 크롤링으로 수집 (Redis에만 저장)
@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateScheduler {

    private final ExchangeRateService exchangeRateService;
    private LocalDate lastApiCallDate = null;

    // 하루에 한 번만 API로 기본 데이터 수집 (매일 오전 9시)
    @Scheduled(cron = "0 0 9 * * ?") // 매일 오전 9시
    public void fetchDailyBaseData() {
        try {
            LocalDate today = LocalDate.now();
            log.info("[환율 스케줄러] 일일 기본 데이터 수집 시작 (API) - 날짜: {}", today);

            // API로 당일 데이터 수집 (강제 API 호출)
            exchangeRateService.fetchDailyBaseDataFromApi(today);

            lastApiCallDate = today;
            log.info("[환율 스케줄러] 일일 기본 데이터 수집 완료 - 날짜: {}", today);
        } catch (Exception e) {
            log.error("[환율 스케줄러] 일일 기본 데이터 수집 실패", e);
        }
    }

    // 실시간 크롤링 (5초마다 실행)
    @Scheduled(fixedDelay = 5000) // 5초마다 실행
    public void fetchRealtimeData() {
        try {
            LocalDate today = LocalDate.now();

            // 오늘 날짜가 변경되었거나 아직 API 호출이 안 된 경우
            if (lastApiCallDate == null || !today.equals(lastApiCallDate)) {
                log.info("[환율 스케줄러] 날짜 변경 감지 또는 첫 실행 - API로 기본 데이터 수집 시작");
                // API로 기본 데이터 먼저 수집
                exchangeRateService.fetchDailyBaseDataFromApi(today);
                lastApiCallDate = today;
            }

            // 크롤링으로 실시간 데이터 수집 (Redis에만 저장)
            exchangeRateService.fetchRealtimeDataFromCrawler(today);

        } catch (Exception e) {
            log.error("[환율 스케줄러] 실시간 데이터 수집 실패", e);
        }
    }
}
