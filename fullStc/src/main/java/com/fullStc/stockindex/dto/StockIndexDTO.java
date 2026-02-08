package com.fullStc.stockindex.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 주가지수 정보 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockIndexDTO {
    // 기준일
    private LocalDate basDt;

    // 지수명
    private String idxNm;

    // 종가
    private BigDecimal clpr;

    // 전일 대비
    private BigDecimal vs;

    // 등락률 (%)
    private BigDecimal fltRt;

    // 시장 구분 (KOSPI, KOSDAQ)
    private String mrktCls;
}
