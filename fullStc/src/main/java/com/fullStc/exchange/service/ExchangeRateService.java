package com.fullStc.exchange.service;

import com.fullStc.exchange.dto.ExchangeRateDTO;
import com.fullStc.exchange.dto.ExchangeRateResponseDTO;

import java.time.LocalDate;
import java.util.List;

/**
 * 환율 서비스 인터페이스
 */
public interface ExchangeRateService {
    /**
     * 환율 데이터 조회
     *
     * @param searchDate 조회 날짜 (null이면 당일)
     * @return 환율 응답 DTO
     */
    ExchangeRateResponseDTO getExchangeRates(LocalDate searchDate);

    /**
     * 모든 환율 데이터 조회 (캐시 우선)
     *
     * @return 환율 응답 DTO
     */
    ExchangeRateResponseDTO getAllExchangeRates();

    /**
     * 특정 통화의 환율 조회
     *
     * @param curUnit 통화 코드 (USD, JPY 등)
     * @return 환율 DTO
     */
    ExchangeRateDTO getExchangeRateByCurrency(String curUnit);
}
