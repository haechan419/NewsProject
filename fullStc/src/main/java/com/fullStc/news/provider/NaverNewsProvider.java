package com.fullStc.news.provider;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import com.fullStc.news.dto.UnifiedArticle;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
public class NaverNewsProvider implements NewsProvider {

    private final WebClient client;
    private final String clientId;
    private final String clientSecret;

    public NaverNewsProvider(
            WebClient.Builder builder,
            org.springframework.core.env.Environment env
    ) {
        this.clientId = Objects.requireNonNull(env.getProperty("news.naver.clientId"), "NAVER_CLIENT_ID missing");
        this.clientSecret = Objects.requireNonNull(env.getProperty("news.naver.clientSecret"), "NAVER_CLIENT_SECRET missing");
        String baseUrl = Objects.requireNonNull(env.getProperty("news.naver.baseUrl"), "naver baseUrl missing");

        this.client = builder
                .baseUrl(baseUrl)
                .defaultHeader("X-Naver-Client-Id", clientId)
                .defaultHeader("X-Naver-Client-Secret", clientSecret)
                .build();
    }

    @Override
    public String name() { return "naver"; }

    @Override
    public List<UnifiedArticle> fetch(String category, String query, int size) {
        // size: 최대 100까지 가능하지만 MVP는 20~30 추천
        Map resp = client.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("query", query)
                        .queryParam("display", Math.min(Math.max(size, 1), 30))
                        .queryParam("sort", "date")
                        .build()
                )
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (resp == null) return List.of();
        Object itemsObj = resp.get("items");
        if (!(itemsObj instanceof List<?> items)) return List.of();

        List<UnifiedArticle> out = new ArrayList<>();
        for (Object o : items) {
            if (!(o instanceof Map<?, ?> m)) continue;

            String title = stripHtml(s(m.get("title")));
            String summary = stripHtml(s(m.get("description")));
            String url = s(m.get("link"));
            String pubDate = s(m.get("pubDate"));
            Instant publishedAt = parseRfc1123(pubDate);

            String id = hash(url.isBlank() ? (title + "|" + pubDate) : url);

            out.add(new UnifiedArticle(
                    id,
                    title,
                    summary,
                    url,
                    null,
                    publishedAt,
                    "Naver Search",
                    name(),
                    category
            ));
        }
        return out;
    }

    private static String s(Object v) { return v == null ? "" : String.valueOf(v); }

    private static String stripHtml(String x) {
        if (x == null) return "";
        return x.replaceAll("<[^>]*>", "").replace("&quot;", "\"").replace("&apos;", "'").trim();
    }

    private static Instant parseRfc1123(String pubDate) {
        try {
            // 예: "Thu, 22 Jan 2026 00:00:00 +0900"
            ZonedDateTime zdt = ZonedDateTime.parse(pubDate, DateTimeFormatter.RFC_1123_DATE_TIME);
            return zdt.toInstant();
        } catch (Exception e) {
            return Instant.EPOCH;
        }
    }

    private static String hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : dig) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}

