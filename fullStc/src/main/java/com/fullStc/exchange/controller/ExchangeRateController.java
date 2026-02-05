package com.fullStc.exchange.controller;

import com.fullStc.exchange.client.ExchangeRateCrawler;
import com.fullStc.exchange.dto.ExchangeRateDTO;
import com.fullStc.exchange.dto.ExchangeRateResponseDTO;
import com.fullStc.exchange.dto.KoreaEximApiResponseDTO;
import com.fullStc.exchange.service.ExchangeRateService;
import com.fullStc.exchange.service.impl.ExchangeRateServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// 환율 API Controller
@Tag(name = "환율 API", description = "한국수출입은행 환율 정보 조회 API")
@RestController
@RequestMapping("/api/exchange-rate")
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;
    private final ExchangeRateCrawler exchangeRateCrawler;
    private final ExchangeRateServiceImpl exchangeRateServiceImpl;

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

    // 환율 데이터 수동 갱신
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

    // 크롤링 테스트 엔드포인트
    @Operation(summary = "크롤링 테스트", description = "크롤링이 정상 동작하는지 테스트합니다. API 한도와 무관하게 크롤링만 실행합니다.")
    @GetMapping("/test/crawl")
    public ResponseEntity<Map<String, Object>> testCrawling(
            @RequestParam(required = false) String searchDate) {
        Map<String, Object> result = new HashMap<>();

        try {
            String dateParam = searchDate != null ? searchDate
                    : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            result.put("testDate", dateParam);
            result.put("status", "시작");

            // 크롤링 실행
            List<KoreaEximApiResponseDTO> crawledData = exchangeRateCrawler.crawlExchangeRates(dateParam);

            // 날짜 파싱
            LocalDate crawlDate = LocalDate.parse(dateParam, DateTimeFormatter.ofPattern("yyyyMMdd"));

            // DTO 변환 및 DB 저장
            int savedCount = 0;
            if (!crawledData.isEmpty()) {
                // 크롤링 데이터를 DTO로 변환
                List<ExchangeRateDTO> exchangeRates = crawledData.stream()
                        .filter(item -> item.getCurUnit() != null && !item.getCurUnit().trim().isEmpty())
                        .map(item -> {
                            // KoreaEximApiResponseDTO를 ExchangeRateDTO로 변환
                            return ExchangeRateDTO.builder()
                                    .curUnit(item.getCurUnit())
                                    .curNm(item.getCurNm())
                                    .dealBasR(parseBigDecimal(item.getDealBasR()))
                                    .ttb(parseBigDecimal(item.getTtb()))
                                    .tts(parseBigDecimal(item.getTts()))
                                    .bkpr(parseBigDecimal(item.getBkpr()))
                                    .searchDate(crawlDate)
                                    .build();
                        })
                        .filter(dto -> dto.getCurUnit() != null && !dto.getCurUnit().trim().isEmpty())
                        .toList();

                // DB 저장 (ExchangeRateServiceImpl의 saveToDatabaseWithNewTransaction 메서드 사용)
                if (!exchangeRates.isEmpty()) {
                    try {
                        exchangeRateServiceImpl.saveToDatabaseWithNewTransaction(exchangeRates, crawlDate);
                        savedCount = exchangeRates.size();
                        result.put("dbSaved", true);
                        result.put("dbSavedCount", savedCount);
                    } catch (Exception e) {
                        log.error("[크롤링] DB 저장 실패", e);
                        result.put("dbSaved", false);
                        result.put("dbSaveError", e.getMessage());
                    }
                }
            }

            result.put("status", "성공");
            result.put("dataCount", crawledData.size());
            result.put("data", crawledData);
            result.put("message",
                    String.format("크롤링 성공: %d개의 환율 데이터를 수집했습니다. (DB 저장: %d개)", crawledData.size(), savedCount));

            // 샘플 데이터 (처음 5개만)
            if (!crawledData.isEmpty()) {
                List<Map<String, Object>> samples = crawledData.stream()
                        .limit(5)
                        .map(rate -> {
                            Map<String, Object> sample = new HashMap<>();
                            sample.put("curUnit", rate.getCurUnit());
                            sample.put("curNm", rate.getCurNm());
                            sample.put("dealBasR", rate.getDealBasR());
                            sample.put("ttb", rate.getTtb());
                            sample.put("tts", rate.getTts());
                            return sample;
                        })
                        .toList();
                result.put("samples", samples);
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "실패");
            result.put("error", e.getMessage());
            result.put("errorClass", e.getClass().getSimpleName());
            result.put("message", "크롤링 중 오류가 발생했습니다: " + e.getMessage());

            // 스택 트레이스 (디버깅용)
            if (e.getStackTrace() != null && e.getStackTrace().length > 0) {
                result.put("stackTrace", e.getStackTrace()[0].toString());
            }

            return ResponseEntity.status(500).body(result);
        }
    }

    // 숫자 문자열을 BigDecimal로 변환
    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            // 쉼표 제거 후 변환
            String cleaned = value.replace(",", "").trim();
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // 크롤링 디버깅 엔드포인트 (HTML 구조 확인용)
    @Operation(summary = "크롤링 디버깅", description = "크롤링 대상 웹사이트의 HTML 구조를 확인합니다.")
    @GetMapping("/test/crawl/debug")
    public ResponseEntity<Map<String, Object>> debugCrawling() {
        Map<String, Object> result = new HashMap<>();

        try {
            String url = "https://finance.naver.com/marketindex/exchangeList.naver";

            org.jsoup.nodes.Document doc = org.jsoup.Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .followRedirects(true)
                    .get();

            // 테이블 찾기
            org.jsoup.select.Elements tables = doc.select("table");
            result.put("tableCount", tables.size());

            // 각 테이블의 클래스와 행 개수 확인
            List<Map<String, Object>> tableInfo = new ArrayList<>();
            for (int i = 0; i < Math.min(tables.size(), 5); i++) {
                org.jsoup.nodes.Element table = tables.get(i);
                Map<String, Object> info = new HashMap<>();
                info.put("index", i);
                info.put("class", table.className());
                info.put("id", table.id());
                org.jsoup.select.Elements rows = table.select("tr");
                info.put("rowCount", rows.size());

                // 첫 번째 행의 셀 개수
                if (!rows.isEmpty()) {
                    org.jsoup.select.Elements firstRowCells = rows.get(0).select("td, th");
                    info.put("firstRowCellCount", firstRowCells.size());
                    if (!firstRowCells.isEmpty()) {
                        List<String> firstRowTexts = firstRowCells.stream()
                                .map(org.jsoup.nodes.Element::text)
                                .limit(5)
                                .toList();
                        info.put("firstRowTexts", firstRowTexts);
                    }
                }

                tableInfo.add(info);
            }
            result.put("tables", tableInfo);

            // tbl_exchange 테이블 찾기
            org.jsoup.select.Elements exchangeTable = doc.select("table.tbl_exchange");
            if (!exchangeTable.isEmpty()) {
                org.jsoup.select.Elements rows = exchangeTable.select("tbody tr");
                result.put("exchangeTableRowCount", rows.size());

                // 첫 3개 행의 데이터 샘플
                List<Map<String, Object>> sampleRows = new ArrayList<>();
                for (int i = 0; i < Math.min(rows.size(), 3); i++) {
                    org.jsoup.nodes.Element row = rows.get(i);
                    org.jsoup.select.Elements cells = row.select("td");
                    Map<String, Object> rowData = new HashMap<>();
                    rowData.put("rowIndex", i);
                    rowData.put("cellCount", cells.size());
                    List<String> cellTexts = cells.stream()
                            .map(org.jsoup.nodes.Element::text)
                            .toList();
                    rowData.put("cellTexts", cellTexts);
                    sampleRows.add(rowData);
                }
                result.put("sampleRows", sampleRows);
            } else {
                result.put("exchangeTableRowCount", 0);
                result.put("message", "tbl_exchange 테이블을 찾을 수 없습니다.");
            }

            result.put("status", "성공");
            result.put("url", url);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("status", "실패");
            result.put("error", e.getMessage());
            result.put("errorClass", e.getClass().getSimpleName());
            return ResponseEntity.status(500).body(result);
        }
    }
}
