package com.fullStc.market.client;

import com.fullStc.market.dto.MarketDataDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 해외 뉴스 API 클라이언트
 * GNews API 또는 NewsDataHub 사용
 */
@Slf4j
@Component
public class InternationalNewsClient {

    private final WebClient webClient;

    @Value("${market.gnews.api-key:}")
    private String gnewsApiKey;

    @Value("${market.gnews.enabled:false}")
    private boolean gnewsEnabled;

    private static final List<String> CATEGORIES = List.of(
            "culture", "economy", "it", "politics", "society", "world");

    public InternationalNewsClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("https://gnews.io/api/v4")
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .build();
    }

    /**
     * 해외 뉴스 조회 (US/UK 중심)
     */
    public List<MarketDataDTO.NewsItemDTO> fetchInternationalNews(int maxArticles) {
        List<MarketDataDTO.NewsItemDTO> allNews = new ArrayList<>();

        if (gnewsEnabled && !gnewsApiKey.isEmpty()) {
            // GNews API 사용
            for (String category : CATEGORIES) {
                try {
                    List<MarketDataDTO.NewsItemDTO> categoryNews = fetchNewsFromGNews(category,
                            maxArticles / CATEGORIES.size());
                    allNews.addAll(categoryNews);
                } catch (Exception e) {
                    log.error("GNews API 호출 실패: {}", category, e);
                }
            }
        } else {
            // API Key가 없으면 Google News RSS 사용 (기본값)
            log.info("GNews API Key가 없어 기본 뉴스 반환");
        }

        // 최신순 정렬 및 제한
        return allNews.stream()
                .sorted((a, b) -> b.getPublishedAt().compareTo(a.getPublishedAt()))
                .limit(maxArticles)
                .toList();
    }

    /**
     * GNews API에서 뉴스 조회
     */
    @SuppressWarnings("unchecked")
    private List<MarketDataDTO.NewsItemDTO> fetchNewsFromGNews(String category, int maxArticles) {
        try {
            Map<String, Object> response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search")
                            .queryParam("q", mapCategoryToQuery(category))
                            .queryParam("lang", "en")
                            .queryParam("country", "us")
                            .queryParam("max", maxArticles)
                            .queryParam("apikey", gnewsApiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("articles")) {
                List<Map<String, Object>> articles = (List<Map<String, Object>>) response.get("articles");

                return articles.stream()
                        .map(article -> MarketDataDTO.NewsItemDTO.builder()
                                .title((String) article.get("title"))
                                .summary((String) article.get("description"))
                                .url((String) article.get("url"))
                                .source((String) ((Map<String, Object>) article.get("source")).get("name"))
                                .category(category)
                                .publishedAt(parsePublishedDate((String) article.get("publishedAt")))
                                .build())
                        .toList();
            }
        } catch (Exception e) {
            log.error("GNews API 호출 실패", e);
        }

        return List.of();
    }

    private String mapCategoryToQuery(String category) {
        return switch (category) {
            case "culture" -> "culture OR entertainment";
            case "economy" -> "economy OR business OR finance";
            case "it" -> "technology OR IT OR tech";
            case "politics" -> "politics OR political";
            case "society" -> "society OR social";
            case "world" -> "world OR international";
            default -> category;
        };
    }

    private Instant parsePublishedDate(String dateStr) {
        try {
            if (dateStr != null && !dateStr.isEmpty()) {
                return ZonedDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME).toInstant();
            }
        } catch (Exception e) {
            log.warn("날짜 파싱 실패: {}", dateStr);
        }
        return Instant.now();
    }
}
