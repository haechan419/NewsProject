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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 공공데이터 포털 주가지수 API 클라이언트
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StockIndexApiClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${stock-index.api.service-key:}")
    private String apiKey;

    @Value("${stock-index.api.base-url:https://apis.data.go.kr/1160100/service/GetMarketIndexInfoService}")
    private String baseUrl;

    /**
     * 주가지수 조회
     * 
     * @param basDt   기준일 (YYYYMMDD 형식, null이면 오늘)
     * @param mrktCls 시장 구분 (KOSPI 또는 KOSDAQ)
     * @return 주가지수 정보 리스트
     */
    public List<StockIndexApiResponseDTO> getStockIndex(String basDt, String mrktCls) {
        if (apiKey == null || apiKey.isEmpty()) {
            throw new StockIndexException("API Key가 설정되지 않았습니다. 환경변수 API_KEY를 확인하세요.");
        }

        try {
            // 기준일이 없으면 오늘 날짜 사용 (final 변수로 만들어서 람다에서 사용 가능하게)
            final String finalBasDt = (basDt == null || basDt.isEmpty())
                    ? LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                    : basDt;

            log.info("[주가지수 API] 데이터 조회 시작 - 날짜: {}, 시장: {}", finalBasDt, mrktCls);

            // API 호출
            JsonNode response = webClientBuilder
                    .baseUrl(baseUrl)
                    .build()
                    .get()
                    .uri(uriBuilder -> {
                        uriBuilder.path("/getStockMarketIndex");
                        uriBuilder.queryParam("serviceKey", apiKey);
                        uriBuilder.queryParam("resultType", "json");
                        uriBuilder.queryParam("basDt", finalBasDt);
                        uriBuilder.queryParam("mrktCls", mrktCls);
                        uriBuilder.queryParam("numOfRows", 10);
                        uriBuilder.queryParam("pageNo", 1);
                        return uriBuilder.build();
                    })
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (response == null) {
                log.warn("[주가지수 API] 응답이 비어있습니다.");
                throw new StockIndexException("주가지수 데이터를 찾을 수 없습니다.");
            }

            // 응답 파싱
            List<StockIndexApiResponseDTO> indices = parseResponse(response);

            if (indices.isEmpty()) {
                log.warn("[주가지수 API] 주가지수 데이터를 찾을 수 없습니다. 날짜: {}, 시장: {}", finalBasDt, mrktCls);
                throw new StockIndexException("주가지수 데이터를 찾을 수 없습니다.");
            }

            log.info("[주가지수 API] 데이터 조회 완료 - 날짜: {}, 시장: {}, 개수: {}", finalBasDt, mrktCls, indices.size());
            return indices;

        } catch (WebClientResponseException e) {
            log.error("[주가지수 API] API 호출 실패 - 상태 코드: {}, 응답: {}",
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new StockIndexException("주가지수 API 호출 실패: " + e.getMessage(), e);
        } catch (StockIndexException e) {
            throw e;
        } catch (Exception e) {
            log.error("[주가지수 API] 주가지수 데이터 조회 중 오류 발생", e);
            throw new StockIndexException("주가지수 데이터 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    /**
     * API 응답 파싱
     */
    private List<StockIndexApiResponseDTO> parseResponse(JsonNode response) {
        List<StockIndexApiResponseDTO> indices = new ArrayList<>();

        try {
            // 공공데이터 API 응답 구조: response.body.items.item[]
            JsonNode responseNode = response.get("response");
            if (responseNode == null) {
                log.warn("[주가지수 API] 응답 구조가 올바르지 않습니다. 'response' 필드가 없습니다.");
                return indices;
            }

            JsonNode bodyNode = responseNode.get("body");
            if (bodyNode == null) {
                log.warn("[주가지수 API] 응답 구조가 올바르지 않습니다. 'body' 필드가 없습니다.");
                return indices;
            }

            JsonNode itemsNode = bodyNode.get("items");
            if (itemsNode == null) {
                log.warn("[주가지수 API] 응답 구조가 올바르지 않습니다. 'items' 필드가 없습니다.");
                return indices;
            }

            JsonNode itemNode = itemsNode.get("item");
            if (itemNode == null) {
                log.warn("[주가지수 API] 주가지수 데이터가 없습니다.");
                return indices;
            }

            // item이 배열인 경우
            if (itemNode.isArray()) {
                for (JsonNode node : itemNode) {
                    StockIndexApiResponseDTO dto = parseItem(node);
                    if (dto != null && dto.getIdxNm() != null) {
                        indices.add(dto);
                    }
                }
            } else {
                // item이 단일 객체인 경우
                StockIndexApiResponseDTO dto = parseItem(itemNode);
                if (dto != null && dto.getIdxNm() != null) {
                    indices.add(dto);
                }
            }

        } catch (Exception e) {
            log.error("[주가지수 API] 응답 파싱 중 오류 발생", e);
        }

        return indices;
    }

    /**
     * 개별 아이템 파싱
     */
    private StockIndexApiResponseDTO parseItem(JsonNode node) {
        try {
            return StockIndexApiResponseDTO.builder()
                    .basDt(node.has("basDt") ? node.get("basDt").asText() : null)
                    .idxNm(node.has("idxNm") ? node.get("idxNm").asText() : null)
                    .clpr(node.has("clpr") ? node.get("clpr").asText() : null)
                    .vs(node.has("vs") ? node.get("vs").asText() : null)
                    .fltRt(node.has("fltRt") ? node.get("fltRt").asText() : null)
                    .build();
        } catch (Exception e) {
            log.debug("[주가지수 API] 아이템 파싱 실패: {}", e.getMessage());
            return null;
        }
    }
}
