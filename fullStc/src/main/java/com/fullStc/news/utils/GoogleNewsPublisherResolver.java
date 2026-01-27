package com.fullStc.news.utils;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GoogleNewsPublisherResolver {

    private static final int TIMEOUT_MS = (int) Duration.ofSeconds(8).toMillis();
    private static final String UA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    // "url":"https://..." 또는 url=https://... 같이 박힌 경우도 커버
    private static final Pattern URL_JSON_PATTERN = Pattern.compile("\"url\"\\s*:\\s*\"(https?://[^\"\\\\]+)\"");
    private static final Pattern URL_PLAIN_PATTERN = Pattern.compile("(https?://[^\\s\"'<>]+)");

    public Optional<String> resolve(String googleRssArticleUrl) {
        return resolveInternal(googleRssArticleUrl, new HashSet<>(), 0);
    }

    private Optional<String> resolveInternal(String url, Set<String> visited, int depth) {
        if (url == null || url.isBlank()) return Optional.empty();
        if (depth > 3) return Optional.empty();                 // 루프 방지
        if (!visited.add(url)) return Optional.empty();         // 재방문 방지

        Document doc;
        try {
            Connection conn = Jsoup.connect(url)
                    .userAgent(UA)
                    .timeout(TIMEOUT_MS)
                    .followRedirects(true)
                    .ignoreHttpErrors(true)
                    .ignoreContentType(true);

            // 필요 시 언어/지역 고정 (원하면 제거)
            conn.header("Accept-Language", "en-US,en;q=0.9,ko-KR;q=0.8,ko;q=0.7");

            doc = conn.get();
        } catch (Exception e) {
            return Optional.empty();
        }

        // 1) og:url
        String ogUrl = contentAttr(doc, "meta[property=og:url]", "content");
        Optional<String> picked = pickPublisherUrl(ogUrl);
        if (picked.isPresent()) return picked;

        // 2) canonical
        String canonical = contentAttr(doc, "link[rel=canonical]", "href");
        picked = pickPublisherUrl(canonical);
        if (picked.isPresent()) return picked;

        // 3) <a href="http...">
        for (Element a : doc.select("a[href]")) {
            String href = a.absUrl("href");
            picked = pickPublisherUrl(href);
            if (picked.isPresent()) return picked;
        }

        // 4) HTML 전체에서 "url":"https://..." 패턴 탐색
        String html = doc.html();
        picked = pickFromPatterns(html);
        if (picked.isPresent()) return picked;

        // 5) 혹시 "./articles/..." 형태의 링크로 또 다른 구글뉴스 페이지를 타야 하는 경우
        for (Element a : doc.select("a[href]")) {
            String hrefRaw = a.attr("href");
            if (hrefRaw == null) continue;

            // 예: ./articles/CBMi... 같은 것
            if (hrefRaw.startsWith("./articles/") || hrefRaw.startsWith("/articles/")) {
                String abs = a.absUrl("href");
                Optional<String> deep = resolveInternal(abs, visited, depth + 1);
                if (deep.isPresent()) return deep;
            }
        }

        return Optional.empty();
    }

    private Optional<String> pickFromPatterns(String text) {
        if (text == null) return Optional.empty();

        // JSON 패턴 먼저
        Matcher m = URL_JSON_PATTERN.matcher(text);
        while (m.find()) {
            String candidate = unescape(m.group(1));
            Optional<String> picked = pickPublisherUrl(candidate);
            if (picked.isPresent()) return picked;
        }

        // 그 다음 일반 URL
        m = URL_PLAIN_PATTERN.matcher(text);
        while (m.find()) {
            String candidate = sanitizeUrl(m.group(1));
            Optional<String> picked = pickPublisherUrl(candidate);
            if (picked.isPresent()) return picked;
        }

        return Optional.empty();
    }

    private String contentAttr(Document doc, String cssQuery, String attr) {
        Element el = doc.selectFirst(cssQuery);
        if (el == null) return null;
        String v = el.hasAttr(attr) ? el.attr(attr) : null;
        if (v == null || v.isBlank()) return null;
        return sanitizeUrl(v);
    }

    private Optional<String> pickPublisherUrl(String candidate) {
        if (candidate == null || candidate.isBlank()) return Optional.empty();

        String u = sanitizeUrl(candidate);

        // URL decode 한 번 해볼 가치가 있음 (가끔 %3A%2F%2F 형태)
        u = tryDecode(u);

        // google 계열 제외
        if (isGoogleHost(u)) return Optional.empty();

        // 스킴 없는 경우 제외
        if (!(u.startsWith("http://") || u.startsWith("https://"))) return Optional.empty();

        return Optional.of(u);
    }

    private boolean isGoogleHost(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (host == null) return true;

            host = host.toLowerCase(Locale.ROOT);

            // google.com, news.google.com, googleusercontent 등 전부 컷
            if (host.contains("google.")) return true;
            if (host.contains("gstatic.")) return true;
            if (host.contains("googleusercontent.")) return true;

            return false;
        } catch (Exception e) {
            return true;
        }
    }

    private String sanitizeUrl(String url) {
        // HTML에서 &amp; 같은 게 섞여 들어오는 경우 정리
        return url.replace("&amp;", "&").trim();
    }

    private String tryDecode(String url) {
        try {
            // 너무 과한 디코딩으로 망가지는 경우도 있어서 “한 번만”
            return URLDecoder.decode(url, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return url;
        }
    }

    private String unescape(String s) {
        // JSON 내 \" \/ 같은 것 최소 처리
        return s.replace("\\/", "/").replace("\\u0026", "&");
    }
}
