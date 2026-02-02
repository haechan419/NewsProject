package com.fullStc.market.service;

import com.fullStc.market.dto.MarketDataDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * 한국 지수 서비스
 * Python FinanceDataReader를 통해 코스피/코스닥 데이터 수집
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class KoreanIndexService {

    private final WebClient.Builder webClientBuilder;
    
    @Value("${ai.python.server.url:http://localhost:8000}")
    private String pythonServerUrl;
    
    /**
     * 코스피/코스닥 지수 조회
     */
    public Map<String, MarketDataDTO.IndexDTO> fetchKoreanIndices() {
        Map<String, MarketDataDTO.IndexDTO> indices = new HashMap<>();
        Instant now = Instant.now();
        
        try {
            // Python FastAPI 서버에서 데이터 조회
            WebClient webClient = webClientBuilder
                    .baseUrl(pythonServerUrl)
                    .build();
            
            Map<String, Object> response = webClient.get()
                    .uri("/api/market/korean-indices")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            if (response != null) {
                // KS11 (코스피)
                if (response.containsKey("kospi")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> kospiData = (Map<String, Object>) response.get("kospi");
                    indices.put("KS11", MarketDataDTO.IndexDTO.builder()
                            .symbol("KS11")
                            .name("코스피")
                            .value(getDoubleValue(kospiData, "value"))
                            .change(getDoubleValue(kospiData, "change"))
                            .changePercent(getDoubleValue(kospiData, "changePercent"))
                            .updatedAt(now)
                            .build());
                }
                
                // KQ11 (코스닥)
                if (response.containsKey("kosdaq")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> kosdaqData = (Map<String, Object>) response.get("kosdaq");
                    indices.put("KQ11", MarketDataDTO.IndexDTO.builder()
                            .symbol("KQ11")
                            .name("코스닥")
                            .value(getDoubleValue(kosdaqData, "value"))
                            .change(getDoubleValue(kosdaqData, "change"))
                            .changePercent(getDoubleValue(kosdaqData, "changePercent"))
                            .updatedAt(now)
                            .build());
                }
            }
            
        } catch (Exception e) {
            log.error("한국 지수 조회 실패 (Python 서버)", e);
        }
        
        // Python 서버 실패 시 기본값
        if (indices.isEmpty()) {
            indices.put("KS11", MarketDataDTO.IndexDTO.builder()
                    .symbol("KS11")
                    .name("코스피")
                    .value(2500.0)
                    .change(0.0)
                    .changePercent(0.0)
                    .updatedAt(now)
                    .build());
            
            indices.put("KQ11", MarketDataDTO.IndexDTO.builder()
                    .symbol("KQ11")
                    .name("코스닥")
                    .value(800.0)
                    .change(0.0)
                    .changePercent(0.0)
                    .updatedAt(now)
                    .build());
        }
        
        return indices;
    }
    
    private double getDoubleValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }
}
