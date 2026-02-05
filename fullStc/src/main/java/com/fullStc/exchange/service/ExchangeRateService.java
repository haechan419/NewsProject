package com.fullStc.exchange.service;

import com.fullStc.exchange.dto.ExchangeRateDTO;
import com.fullStc.exchange.dto.ExchangeRateResponseDTO;

import java.time.LocalDate;

// 환율 서비스 인터페이스
public interface ExchangeRateService {
    // 환율 데이터 조회
    ExchangeRateResponseDTO getExchangeRates(LocalDate searchDate);

    // 모든 환율 데이터 조회 (캐시 우선)
    ExchangeRateResponseDTO getAllExchangeRates();

    // 특정 통화의 환율 조회
    ExchangeRateDTO getExchangeRateByCurrency(String curUnit);
}
