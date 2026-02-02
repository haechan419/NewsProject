package com.fullStc.news.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import com.fullStc.news.dto.UnifiedArticle;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Component
public class NaverNewsProvider implements NewsProvider {

    private final WebClient client;
    private final String clientId;
    private final String clientSecret;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter
            .ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);

    public NaverNewsProvider(
            WebClient.Builder builder,
            org.springframework.core.env.Environment env) {
        this.clientId = Objects.requireNonNull(env.getProperty("news.naver.clientId"), "NAVER_CLIENT_ID missing");
        this.clientSecret = Objects.requireNonNull(env.getProperty("news.naver.clientSecret"),
                "NAVER_CLIENT_SECRET missing");
        String baseUrl = Objects.requireNonNull(env.getProperty("news.naver.baseUrl"), "naver baseUrl missing");

        this.client = builder
                .baseUrl(baseUrl)
                .defaultHeader("X-Naver-Client-Id", clientId)
                .defaultHeader("X-Naver-Client-Secret", clientSecret)
                .build();
    }

    @Override
    public String name() {
        return "naver";
    }

    @Override
    public List<UnifiedArticle> fetch(String category, String query, int size) {

        // 1. [진입 로그]
        log.info("👀 [Naver Entry] Category='{}', Query='{}'", category, query);

        // 2. [무조건 단순화 전략]
        // 들어온 query가 뭐든 상관없음. 최신순(sort=date)은 키워드가 짧을수록 잘 나옵니다.
        // 그냥 카테고리 보고 1단어로 통일합니다.
        String targetQuery = switch (category != null ? category.toLowerCase() : "") {
            case "economy" -> "경제";
            case "politics" -> "정치";
            case "society" -> "사회";
            case "it" -> "IT";
            case "world" -> "국제";
            case "culture" -> "문화";
            // 카테고리가 없거나 이상하면, 원래 쿼리가 있으면 그거 쓰고 없으면 '뉴스'
            default -> (query != null && !query.isBlank()) ? query : "뉴스";
        };

        log.info("🔥 [Naver FORCE] 검색어 단순화: '{}' -> '{}'", query, targetQuery);

        // ★ final 변수에 담기 (람다 에러 방지)
        final String finalQuery = targetQuery;
        final int finalSize = 100; // 많이 가져와서 24시간 필터로 거름

        Map resp = client.get()
                .uri(uriBuilder -> uriBuilder
                        .queryParam("query", finalQuery) // "사회", "경제" 등 단순 키워드 들어감
                        .queryParam("display", finalSize)
                        .queryParam("sort", "date")      // 최신순
                        .build())
                .header(HttpHeaders.ACCEPT, "application/json")
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        // ... (이하 for 루프와 24시간 필터링 로직은 그대로 두시면 됩니다) ...

        if (resp == null) return List.of();
        Object itemsObj = resp.get("items");
        if (!(itemsObj instanceof List<?> items)) return List.of();

        List<UnifiedArticle> out = new ArrayList<>();

        // 24시간 컷 기준 시간
        Instant cutOffTime = Instant.now().minus(1, ChronoUnit.DAYS);

        for (Object o : items) {
            if (!(o instanceof Map<?, ?> m)) continue;

            String title = stripHtml(s(m.get("title")));
            String summary = stripHtml(s(m.get("description")));
            String url = s(m.get("link"));
            String pubDate = s(m.get("pubDate"));

            Instant publishedAt = parseRfc1123(pubDate);

            // 🚨 [24시간 필터링]
            if (publishedAt.isBefore(cutOffTime)) {
                continue; // 24시간 지난 건 버림
            }

            log.info("✅ [Fresh News] {} | {}", pubDate, title);

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

            if (out.size() >= size) break;
        }
        return out;
    }

    private String s(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private static String stripHtml(String x) {
        if (x == null) return "";
        return x.replaceAll("<[^>]*>", "")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&amp;", "&")
                .trim();
    }

    private static Instant parseRfc1123(String pubDate) {
        try {
            ZonedDateTime zdt = ZonedDateTime.parse(pubDate, DATE_FMT);
            return zdt.toInstant();
        } catch (Exception e) {
            return Instant.now();
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