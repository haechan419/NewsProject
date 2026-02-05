package com.fullStc.exchange.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fullStc.exchange.dto.KoreaEximApiResponseDTO;
import com.fullStc.exchange.exception.ExchangeRateException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

// 환율 크롤링 클라이언트 (Python API 호출)
@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateCrawler {

    private final WebClient.Builder webClientBuilder;

    @Value("${exchange-rate.crawler.enabled:true}")
    private boolean crawlerEnabled;

    @Value("${exchange-rate.crawler.python-api-url:http://localhost:8000}")
    private String pythonApiUrl;

    // 환율 데이터 크롤링 (Python API 호출)
    public List<KoreaEximApiResponseDTO> crawlExchangeRates(String searchDate) {
        if (!crawlerEnabled) {
            log.warn("크롤링이 비활성화되어 있습니다.");
            throw new ExchangeRateException("크롤링이 비활성화되어 있습니다.");
        }

        try {
            String dateParam = searchDate != null ? searchDate
                    : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            log.info("[크롤링] Python API를 통한 환율 데이터 수집 시작 - 날짜: {}", dateParam);

            // Python FastAPI 크롤링 엔드포인트 호출
            log.info("[크롤링] Python API 호출: {}", pythonApiUrl);

            JsonNode response = webClientBuilder
                    .baseUrl(pythonApiUrl)
                    .build()
                    .get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/api/exchange-rate/crawl");
                        if (dateParam != null) {
                            uriBuilder.queryParam("search_date", dateParam);
                        }
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null) {
                log.warn("[크롤링] Python API 응답이 비어있습니다.");
                throw new ExchangeRateException("크롤링으로 환율 데이터를 찾을 수 없습니다.");
            }

            JsonNode exchangeRatesNode = response.get("exchange_rates");
            if (exchangeRatesNode == null || !exchangeRatesNode.isArray()) {
                log.warn("[크롤링] Python API 응답 형식이 올바르지 않습니다.");
                throw new ExchangeRateException("크롤링으로 환율 데이터를 찾을 수 없습니다.");
            }

            List<KoreaEximApiResponseDTO> rates = new ArrayList<>();
            for (JsonNode rateNode : exchangeRatesNode) {
                try {
                    KoreaEximApiResponseDTO dto = KoreaEximApiResponseDTO.builder()
                            .curUnit(rateNode.has("curUnit") ? rateNode.get("curUnit").asText() : null)
                            .curNm(rateNode.has("curNm") ? rateNode.get("curNm").asText() : null)
                            .dealBasR(rateNode.has("dealBasR") ? rateNode.get("dealBasR").asText() : null)
                            .ttb(rateNode.has("ttb") ? rateNode.get("ttb").asText() : null)
                            .tts(rateNode.has("tts") ? rateNode.get("tts").asText() : null)
                            .result(rateNode.has("result") ? rateNode.get("result").asInt() : 1)
                            .build();

                    if (dto.getCurUnit() != null && !dto.getCurUnit().trim().isEmpty()) {
                        rates.add(dto);
                    }
                } catch (Exception e) {
                    log.debug("[크롤링] 환율 데이터 파싱 실패: {}", e.getMessage());
                }
            }

            if (rates.isEmpty()) {
                log.warn("[크롤링] 환율 데이터를 찾을 수 없습니다. 날짜: {}", dateParam);
                throw new ExchangeRateException("크롤링으로 환율 데이터를 찾을 수 없습니다.");
            }

            log.info("[크롤링] 환율 데이터 수집 완료 - 날짜: {}, 개수: {}", dateParam, rates.size());
            return rates;

        } catch (WebClientResponseException e) {
            log.error("[크롤링] Python API 호출 실패 - 상태 코드: {}, 응답: {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new ExchangeRateException("크롤링 API 호출 실패: " + e.getMessage(), e);
        } catch (ExchangeRateException e) {
            throw e;
        } catch (Exception e) {
            log.error("[크롤링] 환율 데이터 수집 중 오류 발생", e);
            throw new ExchangeRateException("크롤링 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
