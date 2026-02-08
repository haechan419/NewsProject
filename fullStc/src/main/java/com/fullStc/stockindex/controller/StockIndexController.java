package com.fullStc.stockindex.controller;

import com.fullStc.stockindex.dto.StockIndexDTO;
import com.fullStc.stockindex.dto.StockIndexResponseDTO;
import com.fullStc.stockindex.service.StockIndexService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 주가지수 API Controller
 */
@Tag(name = "주가지수 API", description = "공공데이터 포털 주가지수 정보 조회 API")
@RestController
@RequestMapping("/api/stock-index")
@RequiredArgsConstructor
@Slf4j
public class StockIndexController {

    private final StockIndexService stockIndexService;

    @Operation(summary = "모든 주가지수 조회", description = "지정한 날짜의 주가지수 정보를 조회합니다. (기본값: 오늘)")
    @GetMapping
    public ResponseEntity<StockIndexResponseDTO> getStockIndices(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate searchDate) {
        StockIndexResponseDTO response = stockIndexService.getStockIndices(searchDate);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "특정 시장 주가지수 조회", description = "시장 구분(KOSPI 또는 KOSDAQ)과 날짜로 주가지수를 조회합니다.")
    @GetMapping("/{mrktCls}")
    public ResponseEntity<StockIndexDTO> getStockIndexByMarket(
            @PathVariable String mrktCls,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate searchDate) {
        StockIndexDTO response = stockIndexService.getStockIndexByMarket(mrktCls, searchDate);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "주가지수 데이터 수동 수집", description = "API에서 주가지수 데이터를 가져와서 DB에 저장합니다.")
    @PostMapping("/fetch")
    public ResponseEntity<String> fetchStockIndices(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate searchDate) {
        try {
            stockIndexService.fetchAndSaveStockIndices(searchDate);
            return ResponseEntity.ok("주가지수 데이터 수집이 완료되었습니다.");
        } catch (Exception e) {
            log.error("주가지수 데이터 수집 실패", e);
            return ResponseEntity.internalServerError()
                    .body("주가지수 데이터 수집 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
