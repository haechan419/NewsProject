
package com.fullStc.news.provider;

import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import com.fullStc.news.dto.UnifiedArticle;

import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class RssNewsProvider implements NewsProvider {

    private final Environment env;

    public RssNewsProvider(Environment env) {
        this.env = env;
    }

    @Override
    public String name() { return "rss"; }

    @Override
    public List<UnifiedArticle> fetch(String category, String query, int size) {
      //  String prefix = "news.rss.feeds." + category;

        String prefix = "news.rss.feeds." + category.toLowerCase();
        // ✅ properties의 [0],[1] 형태를 안정적으로 List로 바인딩
        List<String> feeds = Binder.get(env)
                .bind(prefix, Bindable.listOf(String.class))
                .orElse(List.of());

        if (feeds.isEmpty()) return List.of();

        List<UnifiedArticle> out = new ArrayList<>();
        for (String feedUrl : feeds) {
            out.addAll(readFeed(feedUrl, category, size));
            if (out.size() >= size) break;
        }
        return out.stream().limit(size).toList();
    }
    private List<UnifiedArticle> readFeed(String feedUrl, String category, int size) {
        try {
            URL url = new URL(feedUrl);
            var conn = url.openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setRequestProperty("Accept-Charset", "UTF-8");

            try (XmlReader reader = new XmlReader(conn.getInputStream(), "UTF-8")) {
                SyndFeed feed = new SyndFeedInput().build(reader);

                List<UnifiedArticle> list = new ArrayList<>();
                for (SyndEntry e : feed.getEntries()) {
                    String title = safe(e.getTitle());
                    String link = safe(e.getLink());
                    Instant publishedAt = (e.getPublishedDate() != null)
                            ? e.getPublishedDate().toInstant()
                            : Instant.EPOCH;

                    String summary = "";
                    if (e.getDescription() != null) {
                        summary = safe(e.getDescription().getValue())
                                .replaceAll("<[^>]*>", "")
                                .trim();
                    }

                    String sourceName = (feed.getTitle() != null) ? feed.getTitle() : "RSS";
                    String id = hash(link.isBlank() ? (title + "|" + publishedAt) : link);

                    list.add(new UnifiedArticle(
                            id, title, summary, link, null, publishedAt,
                            sourceName,
                            "google_rss",
                            category
                    ));

                    if (list.size() >= size) break;
                }
                return list;
            }
        } catch (Exception ex) {
            return List.of();
        }
    }


    private static String safe(String s) { return s == null ? "" : s.trim(); }

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
