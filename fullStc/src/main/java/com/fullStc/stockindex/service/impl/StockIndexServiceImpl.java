package com.fullStc.stockindex.service.impl;

import com.fullStc.stockindex.client.StockIndexApiClient;
import com.fullStc.stockindex.client.StockIndexCrawler;
import com.fullStc.stockindex.domain.StockIndex;
import com.fullStc.stockindex.dto.StockIndexApiResponseDTO;
import com.fullStc.stockindex.dto.StockIndexDTO;
import com.fullStc.stockindex.dto.StockIndexResponseDTO;
import com.fullStc.stockindex.exception.StockIndexException;
import com.fullStc.stockindex.repository.StockIndexRepository;
import com.fullStc.stockindex.service.StockIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 주가지수 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockIndexServiceImpl implements StockIndexService {

    private final StockIndexApiClient apiClient;
    private final StockIndexCrawler crawler;
    private final StockIndexRepository repository;

    @Override
    @Transactional(readOnly = true)
    public StockIndexResponseDTO getStockIndices(LocalDate searchDate) {
        final LocalDate finalSearchDate = (searchDate != null) ? searchDate : LocalDate.now();
        String dateStr = finalSearchDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        try {
            // DB에서 조회
            List<StockIndex> dbIndices = repository.findByBasDt(finalSearchDate);

            if (!dbIndices.isEmpty()) {
                log.info("[주가지수] DB에서 데이터 조회 성공 - 날짜: {}, 개수: {}", dateStr, dbIndices.size());
                List<StockIndexDTO> dtos = dbIndices.stream()
                        .map(this::convertToDTO)
                        .collect(Collectors.toList());

                // 조회된 데이터 상세 로그 출력
                dtos.forEach(dto -> log.info("[주가지수] 조회 데이터 - 시장: {}, 지수명: {}, 종가: {}, 전일대비: {}, 등락률: {}%",
                        dto.getMrktCls(), dto.getIdxNm(), dto.getClpr(), dto.getVs(), dto.getFltRt()));

                return StockIndexResponseDTO.builder()
                        .stockIndices(dtos)
                        .searchDate(dateStr)
                        .result(1)
                        .message("DB 데이터")
                        .build();
            }

            // DB에 없으면 빈 응답 반환
            log.debug("주가지수 데이터 없음: {}", dateStr);
            return StockIndexResponseDTO.builder()
                    .stockIndices(List.of())
                    .searchDate(dateStr)
                    .result(0)
                    .message("데이터 없음")
                    .build();

        } catch (Exception e) {
            log.error("주가지수 조회 실패", e);
            throw new StockIndexException("주가지수 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public StockIndexDTO getStockIndexByMarket(String mrktCls, LocalDate searchDate) {
        final LocalDate finalSearchDate = (searchDate != null) ? searchDate : LocalDate.now();

        StockIndex index = repository.findByMrktClsAndBasDt(mrktCls, finalSearchDate)
                .orElseThrow(() -> new StockIndexException(
                        String.format("주가지수 데이터를 찾을 수 없습니다. 시장: %s, 날짜: %s", mrktCls, finalSearchDate)));

        return convertToDTO(index);
    }

    @Override
    @Transactional
    public void fetchAndSaveStockIndices(LocalDate searchDate) {
        final LocalDate finalSearchDate = (searchDate != null) ? searchDate : LocalDate.now();
        String dateStr = finalSearchDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        log.info("[주가지수] API에서 데이터 수집 시작 - 날짜: {}", dateStr);

        try {
            // KOSPI와 KOSDAQ 모두 조회
            String[] markets = { "KOSPI", "KOSDAQ" };

            for (String mrktCls : markets) {
                try {
                    List<StockIndexApiResponseDTO> apiResponses = null;

                    // 1. API 호출 시도
                    try {
                        log.info("[주가지수] 공공데이터 API 호출 시도 - 시장: {}", mrktCls);
                        apiResponses = apiClient.getStockIndex(dateStr, mrktCls);
                        log.info("[주가지수] 공공데이터 API 호출 성공 - 시장: {}", mrktCls);
                    } catch (Exception apiException) {
                        log.warn("[주가지수] 공공데이터 API 호출 실패 - 시장: {}, 오류: {}", mrktCls, apiException.getMessage());
                        log.info("[주가지수] 크롤링으로 폴백 시도 - 시장: {}", mrktCls);

                        // 2. API 실패 시 크롤링으로 폴백
                        try {
                            apiResponses = crawler.crawlStockIndex(dateStr, mrktCls);
                            log.info("[주가지수] 크롤링 성공 - 시장: {}, 날짜: {}", mrktCls, dateStr);
                        } catch (Exception crawlerException) {
                            log.error("[주가지수] 크롤링도 실패 - 시장: {}, 오류: {}", mrktCls, crawlerException.getMessage());
                            throw new StockIndexException(
                                    String.format("API와 크롤링 모두 실패했습니다. 시장: %s, API 오류: %s, 크롤링 오류: %s",
                                            mrktCls, apiException.getMessage(), crawlerException.getMessage()));
                        }
                    }

                    if (apiResponses == null || apiResponses.isEmpty()) {
                        log.warn("[주가지수] 데이터가 없습니다 - 시장: {}", mrktCls);
                        continue;
                    }

                    // 각 응답을 DB에 저장
                    for (StockIndexApiResponseDTO apiResponse : apiResponses) {
                        // API 응답 데이터 로그 출력
                        log.info("[주가지수] API 응답 데이터 - 시장: {}, 지수명: {}, 종가: {}, 전일대비: {}, 등락률: {}%",
                                mrktCls, apiResponse.getIdxNm(), apiResponse.getClpr(), apiResponse.getVs(),
                                apiResponse.getFltRt());

                        // 이미 저장된 데이터가 있는지 확인
                        repository.findByMrktClsAndBasDt(mrktCls, finalSearchDate)
                                .ifPresentOrElse(
                                        existing -> {
                                            // 기존 데이터 업데이트
                                            StockIndex updated = updateEntity(existing, apiResponse, mrktCls,
                                                    finalSearchDate);
                                            repository.save(updated);
                                            log.info("[주가지수] 데이터 업데이트 완료 - 시장: {}, 날짜: {}, 지수명: {}, 종가: {}",
                                                    mrktCls, dateStr, updated.getIdxNm(), updated.getClpr());
                                        },
                                        () -> {
                                            // 새 데이터 저장
                                            StockIndex newIndex = convertToEntity(apiResponse, mrktCls,
                                                    finalSearchDate);
                                            repository.save(newIndex);
                                            log.info("[주가지수] 데이터 저장 완료 - 시장: {}, 날짜: {}, 지수명: {}, 종가: {}",
                                                    mrktCls, dateStr, newIndex.getIdxNm(), newIndex.getClpr());
                                        });
                    }

                    log.info("[주가지수] 데이터 수집 완료 - 시장: {}, 날짜: {}", mrktCls, dateStr);

                } catch (Exception e) {
                    log.error("[주가지수] 데이터 수집 실패 - 시장: {}, 날짜: {}", mrktCls, dateStr, e);
                    // 하나 실패해도 다른 시장은 계속 시도
                }
            }

            log.info("[주가지수] 모든 시장 데이터 수집 완료 - 날짜: {}", dateStr);

        } catch (Exception e) {
            log.error("[주가지수] 데이터 수집 중 오류 발생 - 날짜: {}", dateStr, e);
            throw new StockIndexException("주가지수 데이터 수집 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * API 응답 DTO를 Entity로 변환
     */
    private StockIndex convertToEntity(StockIndexApiResponseDTO dto, String mrktCls, LocalDate basDt) {
        return StockIndex.builder()
                .basDt(basDt)
                .idxNm(dto.getIdxNm())
                .clpr(parseBigDecimal(dto.getClpr()))
                .vs(parseBigDecimal(dto.getVs()))
                .fltRt(parseBigDecimal(dto.getFltRt()))
                .mrktCls(mrktCls)
                .build();
    }

    /**
     * Entity를 DTO로 변환
     */
    private StockIndexDTO convertToDTO(StockIndex entity) {
        return StockIndexDTO.builder()
                .basDt(entity.getBasDt())
                .idxNm(entity.getIdxNm())
                .clpr(entity.getClpr())
                .vs(entity.getVs())
                .fltRt(entity.getFltRt())
                .mrktCls(entity.getMrktCls())
                .build();
    }

    /**
     * 기존 Entity 업데이트
     */
    private StockIndex updateEntity(StockIndex existing, StockIndexApiResponseDTO dto, String mrktCls,
            LocalDate basDt) {
        return StockIndex.builder()
                .id(existing.getId())
                .basDt(basDt)
                .idxNm(dto.getIdxNm() != null ? dto.getIdxNm() : existing.getIdxNm())
                .clpr(parseBigDecimal(dto.getClpr()) != null ? parseBigDecimal(dto.getClpr()) : existing.getClpr())
                .vs(parseBigDecimal(dto.getVs()) != null ? parseBigDecimal(dto.getVs()) : existing.getVs())
                .fltRt(parseBigDecimal(dto.getFltRt()) != null ? parseBigDecimal(dto.getFltRt()) : existing.getFltRt())
                .mrktCls(mrktCls)
                .build();
    }

    /**
     * 문자열을 BigDecimal로 변환 (쉼표 제거)
     */
    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            // 쉼표 제거 후 변환
            String cleaned = value.replace(",", "").trim();
            if (cleaned.isEmpty()) {
                return null;
            }
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            log.warn("숫자 변환 실패: {}", value);
            return null;
        }
    }
}
