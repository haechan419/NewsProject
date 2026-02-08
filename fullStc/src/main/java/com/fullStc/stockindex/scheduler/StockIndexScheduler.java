package com.fullStc.stockindex.scheduler;

import com.fullStc.stockindex.service.StockIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * 주가지수 데이터 자동 수집 스케줄러
 * 하루 1회 조회 (매일 오전 9시)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StockIndexScheduler {

    private final StockIndexService stockIndexService;

    /**
     * 매일 오전 9시에 주가지수 데이터 수집
     */
    @Scheduled(cron = "0 0 9 * * ?") // 매일 오전 9시
    public void fetchDailyStockIndices() {
        try {
            LocalDate today = LocalDate.now();
            log.info("[주가지수 스케줄러] 일일 데이터 수집 시작 - 날짜: {}", today);

            // API에서 데이터 가져와서 DB에 저장
            stockIndexService.fetchAndSaveStockIndices(today);

            log.info("[주가지수 스케줄러] 일일 데이터 수집 완료 - 날짜: {}", today);
        } catch (Exception e) {
            log.error("[주가지수 스케줄러] 일일 데이터 수집 실패", e);
        }
    }
}
