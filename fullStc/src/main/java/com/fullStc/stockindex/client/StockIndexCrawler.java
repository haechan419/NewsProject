package com.fullStc.stockindex.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fullStc.stockindex.dto.StockIndexApiResponseDTO;
import com.fullStc.stockindex.exception.StockIndexException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.ArrayList;
import java.util.List;

/**
 * 주가지수 크롤링 클라이언트 (Python API 호출)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StockIndexCrawler {

    private final WebClient.Builder webClientBuilder;

    @Value("${stock-index.crawler.enabled:true}")
    private boolean crawlerEnabled;

    @Value("${stock-index.crawler.python-api-url:http://localhost:8000}")
    private String pythonApiUrl;

    /**
     * 주가지수 데이터 크롤링 (Python API 호출)
     * 
     * @param searchDate 조회 날짜 (YYYYMMDD 형식, null이면 오늘)
     * @param mrktCls    시장 구분 (KOSPI 또는 KOSDAQ, null이면 둘 다)
     * @return 주가지수 정보 리스트
     */
    public List<StockIndexApiResponseDTO> crawlStockIndex(String searchDate, String mrktCls) {
        if (!crawlerEnabled) {
            log.warn("[크롤링] 주가지수 크롤링이 비활성화되어 있습니다.");
            throw new StockIndexException("크롤링이 비활성화되어 있습니다.");
        }

        try {
            final String dateParam = searchDate != null ? searchDate
                    : java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));

            log.info("[크롤링] Python API를 통한 주가지수 데이터 수집 시작 - 날짜: {}, 시장: {}", dateParam,
                    mrktCls != null ? mrktCls : "전체");

            // Python FastAPI 크롤링 엔드포인트 호출
            JsonNode response = webClientBuilder
                    .baseUrl(pythonApiUrl)
                    .build()
                    .get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/api/stock-index/crawl");
                        uriBuilder.queryParam("search_date", dateParam);
                        if (mrktCls != null && !mrktCls.isEmpty()) {
                            uriBuilder.queryParam("mrkt_cls", mrktCls);
                        }
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null) {
                log.warn("[크롤링] Python API 응답이 비어있습니다.");
                throw new StockIndexException("크롤링으로 주가지수 데이터를 찾을 수 없습니다.");
            }

            JsonNode stockIndicesNode = response.get("stock_indices");
            if (stockIndicesNode == null || !stockIndicesNode.isArray()) {
                log.warn("[크롤링] Python API 응답 형식이 올바르지 않습니다.");
                throw new StockIndexException("크롤링으로 주가지수 데이터를 찾을 수 없습니다.");
            }

            List<StockIndexApiResponseDTO> indices = new ArrayList<>();
            for (JsonNode indexNode : stockIndicesNode) {
                try {
                    StockIndexApiResponseDTO dto = StockIndexApiResponseDTO.builder()
                            .basDt(indexNode.has("basDt") ? indexNode.get("basDt").asText() : null)
                            .idxNm(indexNode.has("idxNm") ? indexNode.get("idxNm").asText() : null)
                            .clpr(indexNode.has("clpr") ? indexNode.get("clpr").asText() : null)
                            .vs(indexNode.has("vs") ? indexNode.get("vs").asText() : null)
                            .fltRt(indexNode.has("fltRt") ? indexNode.get("fltRt").asText() : null)
                            .build();

                    if (dto.getIdxNm() != null && !dto.getIdxNm().trim().isEmpty()) {
                        indices.add(dto);
                    }
                } catch (Exception e) {
                    log.debug("[크롤링] 주가지수 데이터 파싱 실패: {}", e.getMessage());
                }
            }

            if (indices.isEmpty()) {
                log.warn("[크롤링] 주가지수 데이터를 찾을 수 없습니다. 시장: {}", mrktCls);
                throw new StockIndexException("크롤링으로 주가지수 데이터를 찾을 수 없습니다.");
            }

            log.info("[크롤링] 주가지수 데이터 수집 완료 - 시장: {}, 개수: {}", mrktCls != null ? mrktCls : "전체", indices.size());
            return indices;

        } catch (WebClientResponseException e) {
            log.error("[크롤링] Python API 호출 실패 - 상태 코드: {}, 응답: {}",
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new StockIndexException("크롤링 API 호출 실패: " + e.getMessage(), e);
        } catch (StockIndexException e) {
            throw e;
        } catch (Exception e) {
            log.error("[크롤링] 주가지수 데이터 수집 중 오류 발생", e);
            throw new StockIndexException("크롤링 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }
}
