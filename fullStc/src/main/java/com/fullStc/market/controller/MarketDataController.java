package com.fullStc.market.controller;

import com.fullStc.market.dto.MarketDataDTO;
import com.fullStc.market.service.MarketDataAggregatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 금융 시장 데이터 REST API 및 SSE 엔드포인트
 */
@RestController
@RequestMapping("/api/market")
@RequiredArgsConstructor
public class MarketDataController {

    private final MarketDataAggregatorService aggregatorService;
    private final ScheduledExecutorService executorService = Executors.newScheduledThreadPool(2);
    
    /**
     * 최신 시장 데이터 조회 (REST API)
     */
    @GetMapping("/latest")
    public ResponseEntity<MarketDataDTO> getLatestMarketData() {
        MarketDataDTO data = aggregatorService.getMarketData();
        return ResponseEntity.ok(data);
    }
    
    /**
     * Server-Sent Events (SSE) 스트림
     * 실시간으로 시장 데이터를 전송
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamMarketData() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // 무제한 타임아웃
        
        // 초기 데이터 전송
        try {
            MarketDataDTO initialData = aggregatorService.getMarketData();
            emitter.send(SseEmitter.event()
                    .name("market-data")
                    .data(initialData));
        } catch (IOException e) {
            emitter.completeWithError(e);
            return emitter;
        }
        
        // 주기적으로 데이터 전송 (5초마다)
        executorService.scheduleAtFixedRate(() -> {
            try {
                MarketDataDTO data = aggregatorService.getMarketData();
                emitter.send(SseEmitter.event()
                        .name("market-data")
                        .data(data));
            } catch (IOException e) {
                emitter.completeWithError(e);
            } catch (Exception e) {
                // 에러 발생 시 로그만 남기고 계속 진행
                System.err.println("SSE 전송 오류: " + e.getMessage());
            }
        }, 5, 5, TimeUnit.SECONDS);
        
        // 클라이언트 연결 종료 시 정리
        emitter.onCompletion(() -> {
            // 정리 작업 (필요시)
        });
        
        emitter.onTimeout(() -> {
            emitter.complete();
        });
        
        return emitter;
    }
}
