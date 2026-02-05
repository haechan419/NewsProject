package com.fullStc.exchange.controller;

import com.fullStc.exchange.dto.ExchangeRateDTO;
import com.fullStc.exchange.dto.ExchangeRateResponseDTO;
import com.fullStc.exchange.service.ExchangeRateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * 환율 API Controller
 */
@Tag(name = "환율 API", description = "한국수출입은행 환율 정보 조회 API")
@RestController
@RequestMapping("/api/exchange-rate")
@RequiredArgsConstructor
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    @Operation(summary = "모든 환율 조회", description = "당일 환율 정보를 조회합니다. (캐시 우선)")
    @GetMapping
    public ResponseEntity<ExchangeRateResponseDTO> getAllExchangeRates() {
        ExchangeRateResponseDTO response = exchangeRateService.getAllExchangeRates();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "특정 날짜 환율 조회", description = "지정한 날짜의 환율 정보를 조회합니다.")
    @GetMapping("/date/{searchDate}")
    public ResponseEntity<ExchangeRateResponseDTO> getExchangeRatesByDate(
            @PathVariable @DateTimeFormat(pattern = "yyyyMMdd") LocalDate searchDate) {
        ExchangeRateResponseDTO response = exchangeRateService.getExchangeRates(searchDate);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "특정 통화 환율 조회", description = "통화 코드로 특정 통화의 환율 정보를 조회합니다.")
    @GetMapping("/currency/{curUnit}")
    public ResponseEntity<ExchangeRateDTO> getExchangeRateByCurrency(
            @PathVariable String curUnit) {
        ExchangeRateDTO response = exchangeRateService.getExchangeRateByCurrency(curUnit);
        return ResponseEntity.ok(response);
    }

    /**
     * 환율 데이터 수동 갱신 (API 강제 호출하여 DB 저장)
     * POST /api/exchange-rate/refresh
     */
    @Operation(summary = "환율 데이터 수동 갱신", description = "한국수출입은행 API를 호출하여 당일 환율 데이터를 강제로 갱신하고 DB에 저장합니다.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "갱신할 날짜 (선택, yyyyMMdd 형식, 없으면 당일)", required = false)
    @PostMapping("/refresh")
    public ResponseEntity<ExchangeRateResponseDTO> refreshExchangeRates(
            @RequestParam(required = false) String searchDate) {
        try {
            java.time.LocalDate date = null;
            if (searchDate != null && !searchDate.isEmpty()) {
                date = java.time.LocalDate.parse(searchDate,
                        java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
            }
            ExchangeRateResponseDTO response = exchangeRateService.getExchangeRates(date);
            return ResponseEntity.ok(response);
        } catch (java.time.format.DateTimeParseException e) {
            throw new IllegalArgumentException("잘못된 날짜 형식입니다. yyyyMMdd 형식이어야 합니다: " + searchDate);
        }
    }
}
