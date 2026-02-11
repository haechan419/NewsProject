package com.fullStc.stockindex.service;

import com.fullStc.stockindex.dto.StockIndexDTO;
import com.fullStc.stockindex.dto.StockIndexResponseDTO;

import java.time.LocalDate;
import java.util.List;

/**
 * 주가지수 서비스 인터페이스
 */
public interface StockIndexService {
    /**
     * 주가지수 조회
     * 
     * @param searchDate 조회 날짜 (null이면 오늘)
     * @return 주가지수 응답 DTO
     */
    StockIndexResponseDTO getStockIndices(LocalDate searchDate);

    /**
     * 특정 시장의 주가지수 조회
     * 
     * @param mrktCls 시장 구분 (KOSPI 또는 KOSDAQ)
     * @param searchDate 조회 날짜 (null이면 오늘)
     * @return 주가지수 DTO
     */
    StockIndexDTO getStockIndexByMarket(String mrktCls, LocalDate searchDate);

    /**
     * API에서 주가지수 데이터 가져와서 DB에 저장
     * 
     * @param searchDate 조회 날짜 (null이면 오늘)
     */
    void fetchAndSaveStockIndices(LocalDate searchDate);
}
