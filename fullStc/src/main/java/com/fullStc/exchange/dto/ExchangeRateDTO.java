package com.fullStc.exchange.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 환율 정보 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRateDTO {
    /**
     * 통화 코드 (USD, JPY, EUR 등)
     */
    private String curUnit;

    /**
     * 국가/통화명
     */
    private String curNm;

    /**
     * 매매 기준율
     */
    private BigDecimal dealBasR;

    /**
     * 송금 받으실 때
     */
    private BigDecimal ttb;

    /**
     * 송금 보내실 때
     */
    private BigDecimal tts;

    /**
     * 장부가격
     */
    private BigDecimal bkpr;

    /**
     * 조회 날짜
     */
    private LocalDate searchDate;
}
