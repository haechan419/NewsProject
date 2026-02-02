package com.fullStc.market.service;

import com.fullStc.market.client.ExchangeRateClient;
import com.fullStc.market.client.GlobalIndexClient;
import com.fullStc.market.client.InternationalNewsClient;
import com.fullStc.market.dto.MarketDataDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 금융 데이터 집계 서비스
 * 여러 소스에서 데이터를 수집하여 통합
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarketDataAggregatorService {

    private final ExchangeRateClient exchangeRateClient;
    private final GlobalIndexClient globalIndexClient;
    private final KoreanIndexService koreanIndexService;
    private final InternationalNewsClient internationalNewsClient;
    private final MarketDataCacheService cacheService;

    /**
     * 전체 시장 데이터 수집 및 캐시 저장
     */
    public MarketDataDTO collectAndCacheMarketData() {
        log.info("시장 데이터 수집 시작");

        try {
            // 이전 데이터 조회 (변동액 계산용)
            MarketDataDTO previousData = cacheService.getMarketData();
            log.info("이전 데이터 조회: {}", previousData != null ? "존재함" : "없음");

            // 1. 환율 데이터 수집
            Map<String, MarketDataDTO.ExchangeRateDTO> exchangeRates = exchangeRateClient.fetchExchangeRates();
            log.info("환율 데이터 수집 완료: {}개 통화", exchangeRates.size());

            // 이전 환율 데이터와 비교하여 변동액 계산
            if (previousData != null && previousData.getExchangeRates() != null) {
                log.info("이전 환율 데이터 존재: {}개 통화", previousData.getExchangeRates().size());
                exchangeRates.forEach((code, current) -> {
                    MarketDataDTO.ExchangeRateDTO previous = previousData.getExchangeRates().get(code);
                    if (previous != null && previous.getRate() != null && current.getRate() != null) {
                        double change = current.getRate() - previous.getRate();
                        double changePercent = (change / previous.getRate()) * 100;
                        current.setChange(change);
                        current.setChangePercent(changePercent);
                        log.info("환율 변동 계산: {} - 이전: {}, 현재: {}, 변동: {}, 변동률: {}%",
                                code, previous.getRate(), current.getRate(), change, changePercent);
                    } else {
                        log.warn("환율 변동 계산 실패: {} - 이전 데이터 없음 (previous: {}, current: {})",
                                code, previous != null ? previous.getRate() : "null", current.getRate());
                    }
                });
            } else {
                log.warn("환율 변동 계산: 이전 데이터가 없어 변동액을 계산할 수 없습니다. (첫 실행 또는 캐시 만료)");
            }

            // 2. 글로벌 지수 수집
            Map<String, MarketDataDTO.IndexDTO> globalIndices = globalIndexClient.fetchGlobalIndices();

            // 이전 글로벌 지수 데이터와 비교하여 변동액 계산
            if (previousData != null && previousData.getGlobalIndices() != null) {
                globalIndices.forEach((symbol, current) -> {
                    MarketDataDTO.IndexDTO previous = previousData.getGlobalIndices().get(symbol);
                    if (previous != null && previous.getValue() != null && current.getValue() != null) {
                        double change = current.getValue() - previous.getValue();
                        double changePercent = (change / previous.getValue()) * 100;
                        current.setChange(change);
                        current.setChangePercent(changePercent);
                    }
                });
            }

            // 3. 한국 지수 수집
            Map<String, MarketDataDTO.IndexDTO> koreanIndices = koreanIndexService.fetchKoreanIndices();

            // 이전 한국 지수 데이터와 비교하여 변동액 계산
            if (previousData != null && previousData.getKoreanIndices() != null) {
                koreanIndices.forEach((symbol, current) -> {
                    MarketDataDTO.IndexDTO previous = previousData.getKoreanIndices().get(symbol);
                    if (previous != null && previous.getValue() != null && current.getValue() != null) {
                        double change = current.getValue() - previous.getValue();
                        double changePercent = (change / previous.getValue()) * 100;
                        current.setChange(change);
                        current.setChangePercent(changePercent);
                    }
                });
            }

            // 4. 해외 뉴스 수집
            List<MarketDataDTO.NewsItemDTO> internationalNews = internationalNewsClient.fetchInternationalNews(30);

            // 5. 통합 데이터 생성
            MarketDataDTO marketData = MarketDataDTO.builder()
                    .exchangeRates(exchangeRates)
                    .globalIndices(globalIndices)
                    .koreanIndices(koreanIndices)
                    .internationalNews(internationalNews)
                    .updatedAt(Instant.now())
                    .build();

            // 6. Redis 캐시에 저장
            cacheService.saveMarketData(marketData);

            log.info("시장 데이터 수집 완료: 환율 {}개, 글로벌지수 {}개, 한국지수 {}개, 뉴스 {}개",
                    exchangeRates.size(), globalIndices.size(), koreanIndices.size(), internationalNews.size());

            return marketData;

        } catch (Exception e) {
            log.error("시장 데이터 수집 실패", e);

            // 실패 시 캐시에서 조회
            MarketDataDTO cachedData = cacheService.getMarketData();
            if (cachedData != null) {
                log.info("캐시된 데이터 반환");
                return cachedData;
            }

            // 캐시도 없으면 빈 데이터 반환
            return MarketDataDTO.builder()
                    .exchangeRates(new HashMap<>())
                    .globalIndices(new HashMap<>())
                    .koreanIndices(new HashMap<>())
                    .internationalNews(List.of())
                    .updatedAt(Instant.now())
                    .build();
        }
    }

    /**
     * 캐시에서 시장 데이터 조회
     */
    public MarketDataDTO getMarketData() {
        MarketDataDTO cachedData = cacheService.getMarketData();
        if (cachedData != null) {
            return cachedData;
        }

        // 캐시가 없으면 즉시 수집
        return collectAndCacheMarketData();
    }
}
