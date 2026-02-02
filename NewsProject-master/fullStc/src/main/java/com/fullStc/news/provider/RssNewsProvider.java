package com.fullStc.news.provider;

import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import lombok.extern.slf4j.Slf4j; // 로그 추가
import org.springframework.stereotype.Component;
import com.fullStc.news.dto.UnifiedArticle;

import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
public class RssNewsProvider implements NewsProvider {

    // Environment 의존성 제거 (직접 URL 매핑함)

    @Override
    public String name() {
        return "rss";
    }

    @Override
    public List<UnifiedArticle> fetch(String category, String query, int size) {
        // 1. 카테고리에 맞는 RSS 주소 가져오기 (설정 파일 X, 직접 매핑 O)
        String feedUrl = getGoogleNewsRssUrl(category);

        log.info("📡 [RSS] '{}' 카테고리 수집 시작... (URL: {})", category, feedUrl);

        List<UnifiedArticle> result = readFeed(feedUrl, category, size);

        log.info("✅ [RSS] '{}' 수집 완료: {}건", category, result.size());

        return result;
    }

    // ★ [핵심] 카테고리별 구글 뉴스 RSS 주소 하드코딩 (확실한 해결책)
    private String getGoogleNewsRssUrl(String category) {
        String keyword = switch (category.toLowerCase()) {
            case "politics" -> "정치";
            case "economy" -> "경제";
            case "society" -> "사회";
            case "culture" -> "생활문화";
            case "world" -> "국제";
            case "it" -> "IT과학";
            default -> "뉴스"; // 기본
        };
        // 구글 뉴스 검색 RSS (정확도순)
        return "https://news.google.com/rss/search?q=" + keyword + "&hl=ko&gl=KR&ceid=KR%3Ako";
    }

    private List<UnifiedArticle> readFeed(String feedUrl, String category, int size) {
        try {
            URL url = new URL(feedUrl);
            var conn = url.openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setRequestProperty("Accept-Charset", "UTF-8"); // 인코딩 이슈 방지

            try (XmlReader reader = new XmlReader(conn.getInputStream())) { // Rome이 알아서 인코딩 감지함
                SyndFeed feed = new SyndFeedInput().build(reader);

                List<UnifiedArticle> list = new ArrayList<>();
                for (SyndEntry e : feed.getEntries()) {
                    if (list.size() >= size)
                        break; // 사이즈 제한

                    String title = safe(e.getTitle());
                    String link = safe(e.getLink());
                    Instant publishedAt = (e.getPublishedDate() != null)
                            ? e.getPublishedDate().toInstant()
                            : Instant.EPOCH;

                    String summary = "";
                    if (e.getDescription() != null) {
                        summary = safe(e.getDescription().getValue())
                                .replaceAll("<[^>]*>", "") // HTML 태그 제거
                                .trim();
                    }

                    // 내용이 너무 짧으면 제목을 요약으로 사용
                    if (summary.length() < 10)
                        summary = title;

                    String sourceName = "Google News RSS";
                    // ID 생성
                    String id = hash(link.isBlank() ? (title + "|" + publishedAt) : link);

                    list.add(new UnifiedArticle(
                            id,
                            title,
                            summary,
                            link,
                            null,
                            publishedAt,
                            sourceName,
                            "rss", // provider name
                            category));
                }
                return list;
            }
        } catch (Exception ex) {
            log.error("💥 [RSS] 실패 (URL: {}): {}", feedUrl, ex.getMessage());
            return List.of();
        }
    }

    private static String safe(String s) {
        return s == null ? "" : s.trim();
    }

    private static String hash(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : dig)
                sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}
