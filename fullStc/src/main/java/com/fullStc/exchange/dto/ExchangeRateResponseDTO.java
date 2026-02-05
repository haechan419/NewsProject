package com.fullStc.exchange.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

// 환율 API 응답 DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRateResponseDTO {
    // 환율 목록
    private List<ExchangeRateDTO> exchangeRates;

    // 조회 날짜
    private String searchDate;

    // 결과 코드 (1: 성공)
    private Integer result;

    // 결과 메시지
    private String message;
}
