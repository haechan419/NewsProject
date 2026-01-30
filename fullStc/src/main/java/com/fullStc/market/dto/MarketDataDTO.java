package com.fullStc.market.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * 금융 시장 데이터 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketDataDTO {
    
    // 환율 데이터
    private Map<String, ExchangeRateDTO> exchangeRates;
    
    // 글로벌 지수
    private Map<String, IndexDTO> globalIndices;
    
    // 한국 지수
    private Map<String, IndexDTO> koreanIndices;
    
    // 해외 뉴스
    private List<NewsItemDTO> internationalNews;
    
    // 업데이트 시간
    private Instant updatedAt;
    
    /**
     * 환율 데이터
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExchangeRateDTO {
        private String code;          // USD, EUR, JPY 등
        private String name;          // 통화명
        private Double rate;          // 환율
        private Double change;         // 변동액
        private Double changePercent;  // 변동률 (%)
        private Instant updatedAt;
    }
    
    /**
     * 지수 데이터
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IndexDTO {
        private String symbol;        // SPX, KS11, KQ11 등
        private String name;          // 지수명
        private Double value;         // 현재 값
        private Double change;        // 변동액
        private Double changePercent; // 변동률 (%)
        private Instant updatedAt;
    }
    
    /**
     * 뉴스 아이템
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NewsItemDTO {
        private String title;
        private String summary;
        private String url;
        private String source;
        private String category;       // culture, economy, IT, politics, society, world
        private Instant publishedAt;
    }
}
