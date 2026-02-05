package com.fullStc.exchange.client;

import com.fullStc.exchange.dto.KoreaEximApiResponseDTO;
import com.fullStc.exchange.exception.ExchangeRateException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

// 한국수출입은행 환율 API Client
@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateApiClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${exchange-rate.api.base-url:https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON}")
    private String baseUrl;

    @Value("${exchange-rate.api.authkey:1bjMCNYULSX7JIDQjeheZpNEHchcTF51}")
    private String authkey;

    // 환율 데이터 조회
    public List<KoreaEximApiResponseDTO> fetchExchangeRates(String searchDate) {
        try {
            String dateParam = searchDate != null ? searchDate
                    : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            log.info("환율 API 호출 시작 - 날짜: {}", dateParam);

            List<KoreaEximApiResponseDTO> response = webClientBuilder
                    .baseUrl(baseUrl)
                    .build()
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .queryParam("authkey", authkey)
                            .queryParam("searchdate", dateParam)
                            .queryParam("data", "AP01") // 환율
                            .build())
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<List<KoreaEximApiResponseDTO>>() {
                    })
                    .block();

            if (response == null || response.isEmpty()) {
                log.warn("환율 API 응답이 비어있습니다. 날짜: {}", dateParam);
                throw new ExchangeRateException("환율 데이터가 없습니다. 비영업일이거나 오전 11시 이전일 수 있습니다.");
            }

            // 결과 코드 확인
            KoreaEximApiResponseDTO firstItem = response.get(0);
            Integer resultCode = firstItem.getResult();
            if (resultCode != null && resultCode != 1) {
                log.error("환율 API 오류 - 결과 코드: {}", resultCode);
                throw new ExchangeRateException("환율 API 오류: 결과 코드 " + resultCode);
            }

            // 유효한 데이터만 필터링
            List<KoreaEximApiResponseDTO> validResponse = response.stream()
                    .filter(item -> {
                        if (item.getResult() != null && item.getResult() != 1)
                            return false;
                        return item.getCurUnit() != null && !item.getCurUnit().trim().isEmpty();
                    })
                    .collect(java.util.stream.Collectors.toList());

            if (validResponse.isEmpty()) {
                log.warn("유효한 환율 데이터가 없습니다. 날짜: {}", dateParam);
                throw new ExchangeRateException("환율 데이터가 없습니다. 비영업일이거나 오전 11시 이전일 수 있습니다.");
            }

            log.info("환율 API 호출 성공 - 데이터 개수: {} (전체: {})", validResponse.size(), response.size());
            return validResponse;

        } catch (WebClientResponseException e) {
            log.error("환율 API 호출 실패 - 상태 코드: {}, 응답: {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new ExchangeRateException("환율 API 호출 실패: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("환율 API 호출 중 예외 발생", e);
            throw new ExchangeRateException("환율 API 호출 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
