package com.fullStc.market.client;

import com.fullStc.market.dto.MarketDataDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * 글로벌 지수 API 클라이언트
 * Alpha Vantage 또는 Twelve Data 사용 (무료 티어)
 */
@Slf4j
@Component
public class GlobalIndexClient {

    private final WebClient webClient;
    
    @Value("${market.alpha-vantage.api-key:demo}")
    private String apiKey;
    
    @Value("${market.alpha-vantage.enabled:false}")
    private boolean alphaVantageEnabled;
    
    public GlobalIndexClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://www.alphavantage.co")
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .build();
    }
    
    /**
     * 글로벌 지수 조회
     * S&P 500, NASDAQ, Dow Jones 등
     */
    public Map<String, MarketDataDTO.IndexDTO> fetchGlobalIndices() {
        Map<String, MarketDataDTO.IndexDTO> indices = new HashMap<>();
        Instant now = Instant.now();
        
        if (alphaVantageEnabled && !"demo".equals(apiKey)) {
            // Alpha Vantage API 사용
            try {
                // S&P 500
                MarketDataDTO.IndexDTO spx = fetchIndexFromAlphaVantage("SPX");
                if (spx != null) {
                    indices.put("SPX", spx);
                }
                
                // NASDAQ
                MarketDataDTO.IndexDTO nasdaq = fetchIndexFromAlphaVantage("NDX");
                if (nasdaq != null) {
                    indices.put("NDX", nasdaq);
                }
                
            } catch (Exception e) {
                log.error("Alpha Vantage API 호출 실패", e);
            }
        }
        
        // API 실패 시 기본값 반환
        if (indices.isEmpty()) {
            indices.put("SPX", MarketDataDTO.IndexDTO.builder()
                    .symbol("SPX")
                    .name("S&P 500")
                    .value(4500.0)
                    .change(0.0)
                    .changePercent(0.0)
                    .updatedAt(now)
                    .build());
        }
        
        return indices;
    }
    
    /**
     * Alpha Vantage에서 지수 데이터 조회
     */
    private MarketDataDTO.IndexDTO fetchIndexFromAlphaVantage(String symbol) {
        try {
            Map<String, Object> response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/query")
                            .queryParam("function", "GLOBAL_QUOTE")
                            .queryParam("symbol", symbol)
                            .queryParam("apikey", apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            if (response != null && response.containsKey("Global Quote")) {
                @SuppressWarnings("unchecked")
                Map<String, String> quote = (Map<String, String>) response.get("Global Quote");
                
                double price = Double.parseDouble(quote.getOrDefault("05. price", "0"));
                double change = Double.parseDouble(quote.getOrDefault("09. change", "0"));
                double changePercent = Double.parseDouble(
                        quote.getOrDefault("10. change percent", "0%").replace("%", ""));
                
                return MarketDataDTO.IndexDTO.builder()
                        .symbol(symbol)
                        .name(getIndexName(symbol))
                        .value(price)
                        .change(change)
                        .changePercent(changePercent)
                        .updatedAt(Instant.now())
                        .build();
            }
        } catch (Exception e) {
            log.error("Alpha Vantage 지수 조회 실패: {}", symbol, e);
        }
        return null;
    }
    
    private String getIndexName(String symbol) {
        return switch (symbol) {
            case "SPX" -> "S&P 500";
            case "NDX" -> "NASDAQ 100";
            case "DJI" -> "Dow Jones";
            default -> symbol;
        };
    }
}
