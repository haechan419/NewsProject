package com.fullStc.stockindex.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 주가지수 API 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockIndexResponseDTO {
    // 주가지수 목록
    private List<StockIndexDTO> stockIndices;

    // 조회 날짜
    private String searchDate;

    // 결과 코드 (1: 성공, 0: 실패)
    private Integer result;

    // 결과 메시지
    private String message;
}
