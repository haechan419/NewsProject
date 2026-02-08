package com.fullStc.stockindex.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 공공데이터 API 응답 DTO (개별 아이템)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class StockIndexApiResponseDTO {
    
    // 기준일 (YYYYMMDD)
    @JsonProperty("basDt")
    private String basDt;

    // 지수명
    @JsonProperty("idxNm")
    private String idxNm;

    // 종가
    @JsonProperty("clpr")
    private String clpr;

    // 전일 대비
    @JsonProperty("vs")
    private String vs;

    // 등락률 (%)
    @JsonProperty("fltRt")
    private String fltRt;
}
