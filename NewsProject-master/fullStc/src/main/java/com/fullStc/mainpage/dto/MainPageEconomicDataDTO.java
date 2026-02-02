package com.fullStc.mainpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 메인페이지용 경제 데이터 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MainPageEconomicDataDTO {
    private String kospi;
    private String kospiChange;
    private String kosdaq;
    private String kosdaqChange;
    private String kospi200;
    private String kospi200Change;
    private String dollar;
    private String dollarChange;
    private Instant updatedAt;
}
