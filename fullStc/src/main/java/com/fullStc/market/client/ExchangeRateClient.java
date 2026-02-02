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
 * 환율 API 클라이언트
 * ExchangeRate.host 사용
 */
@Slf4j
@Component
public class ExchangeRateClient {

        private final WebClient webClient;

        @Value("${market.exchange-rate.api-url:https://api.exchangerate.host/latest}")
        private String apiUrl;

        @Value("${market.exchange-rate.api-key:}")
        private String apiKey;

        public ExchangeRateClient(WebClient.Builder webClientBuilder) {
                this.webClient = webClientBuilder
                                .baseUrl("https://api.exchangerate.host")
                                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                                .build();
        }

        /**
         * 주요 통화 환율 조회 (USD 기준)
         */
        public Map<String, MarketDataDTO.ExchangeRateDTO> fetchExchangeRates() {
                try {
                        // USD 기준으로 주요 통화 조회
                        // ExchangeRate.host 무료 버전은 API Key가 필요 없음
                        // API Key가 있더라도 무료 버전에서는 사용하지 않음
                        Map<String, Object> response = webClient.get()
                                        .uri(uriBuilder -> uriBuilder
                                                        .path("/latest")
                                                        .queryParam("base", "USD")
                                                        .queryParam("symbols", "KRW,EUR,JPY,CNY,GBP")
                                                        .build())
                                        .retrieve()
                                        .bodyToMono(Map.class)
                                        .block();

                        if (response == null || !response.containsKey("rates")) {
                                log.warn("환율 API 응답이 비정상입니다.");
                                return getDefaultExchangeRates();
                        }

                        @SuppressWarnings("unchecked")
                        Map<String, Double> rates = (Map<String, Double>) response.get("rates");
                        Instant updatedAt = Instant.now();

                        log.info("환율 API 응답 수신: KRW={}, EUR={}, JPY={}, CNY={}, GBP={}",
                                        rates.get("KRW"), rates.get("EUR"), rates.get("JPY"), rates.get("CNY"),
                                        rates.get("GBP"));

                        Map<String, MarketDataDTO.ExchangeRateDTO> result = new HashMap<>();

                        // USD/KRW (기준 통화이므로 1.0이지만, 실제로는 KRW/USD를 계산)
                        if (rates.containsKey("KRW")) {
                                double krwRate = rates.get("KRW");
                                result.put("USD", MarketDataDTO.ExchangeRateDTO.builder()
                                                .code("USD")
                                                .name("미국 달러")
                                                .rate(krwRate)
                                                .change(0.0) // 이전 값과 비교 필요
                                                .changePercent(0.0)
                                                .updatedAt(updatedAt)
                                                .build());
                        }

                        // EUR/KRW
                        if (rates.containsKey("EUR")) {
                                double eurToUsd = rates.get("EUR");
                                double eurToKrw = rates.get("KRW") / eurToUsd;
                                result.put("EUR", MarketDataDTO.ExchangeRateDTO.builder()
                                                .code("EUR")
                                                .name("유로")
                                                .rate(eurToKrw)
                                                .change(0.0)
                                                .changePercent(0.0)
                                                .updatedAt(updatedAt)
                                                .build());
                        }

                        // JPY/KRW
                        if (rates.containsKey("JPY")) {
                                double jpyToUsd = rates.get("JPY");
                                double jpyToKrw = rates.get("KRW") / jpyToUsd;
                                result.put("JPY", MarketDataDTO.ExchangeRateDTO.builder()
                                                .code("JPY")
                                                .name("일본 엔")
                                                .rate(jpyToKrw)
                                                .change(0.0)
                                                .changePercent(0.0)
                                                .updatedAt(updatedAt)
                                                .build());
                        }

                        // CNY/KRW (위안)
                        if (rates.containsKey("CNY")) {
                                double cnyToUsd = rates.get("CNY");
                                double cnyToKrw = rates.get("KRW") / cnyToUsd;
                                result.put("CNY", MarketDataDTO.ExchangeRateDTO.builder()
                                                .code("CNY")
                                                .name("중국 위안")
                                                .rate(cnyToKrw)
                                                .change(0.0)
                                                .changePercent(0.0)
                                                .updatedAt(updatedAt)
                                                .build());
                        }

                        // GBP/KRW (파운드)
                        if (rates.containsKey("GBP")) {
                                double gbpToUsd = rates.get("GBP");
                                double gbpToKrw = rates.get("KRW") / gbpToUsd;
                                result.put("GBP", MarketDataDTO.ExchangeRateDTO.builder()
                                                .code("GBP")
                                                .name("영국 파운드")
                                                .rate(gbpToKrw)
                                                .change(0.0)
                                                .changePercent(0.0)
                                                .updatedAt(updatedAt)
                                                .build());
                        }

                        log.info("환율 데이터 수집 완료: {}개 통화", result.size());
                        return result;

                } catch (Exception e) {
                        log.error("환율 API 호출 실패", e);
                        return getDefaultExchangeRates();
                }
        }

        /**
         * 기본 환율 데이터 (API 실패 시)
         */
        private Map<String, MarketDataDTO.ExchangeRateDTO> getDefaultExchangeRates() {
                Map<String, MarketDataDTO.ExchangeRateDTO> defaultRates = new HashMap<>();
                Instant now = Instant.now();

                defaultRates.put("USD", MarketDataDTO.ExchangeRateDTO.builder()
                                .code("USD")
                                .name("미국 달러")
                                .rate(1350.0)
                                .change(0.0)
                                .changePercent(0.0)
                                .updatedAt(now)
                                .build());

                defaultRates.put("EUR", MarketDataDTO.ExchangeRateDTO.builder()
                                .code("EUR")
                                .name("유로")
                                .rate(1450.0)
                                .change(0.0)
                                .changePercent(0.0)
                                .updatedAt(now)
                                .build());

                defaultRates.put("JPY", MarketDataDTO.ExchangeRateDTO.builder()
                                .code("JPY")
                                .name("일본 엔")
                                .rate(9.5)
                                .change(0.0)
                                .changePercent(0.0)
                                .updatedAt(now)
                                .build());

                defaultRates.put("CNY", MarketDataDTO.ExchangeRateDTO.builder()
                                .code("CNY")
                                .name("중국 위안")
                                .rate(190.0)
                                .change(0.0)
                                .changePercent(0.0)
                                .updatedAt(now)
                                .build());

                defaultRates.put("GBP", MarketDataDTO.ExchangeRateDTO.builder()
                                .code("GBP")
                                .name("영국 파운드")
                                .rate(1700.0)
                                .change(0.0)
                                .changePercent(0.0)
                                .updatedAt(now)
                                .build());

                return defaultRates;
        }
}
