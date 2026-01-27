package com.fullStc.news.extract;

import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OriginalUrlResolver {

    private final HttpClient http = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .connectTimeout(Duration.ofSeconds(7))
            .build();

    public String resolve(String url) {
        if (url == null || url.isBlank()) return url;

        String u = url.trim();

        try {
            // 1) 먼저 리다이렉트 따라가서 final URL 확보
            String finalUrl = followRedirects(u);

            // 2) 네이버면: 원문보기 링크를 뽑는다
            if (isNaverNews(finalUrl)) {
                String original = resolveNaverOriginal(finalUrl);
                return original != null ? original : finalUrl;
            }

            // 3) 구글뉴스면: 원문 링크를 뽑는다
            if (isGoogleNews(finalUrl)) {
                String original = resolveGoogleNewsOriginal(finalUrl);
                return original != null ? original : finalUrl;
            }

            return finalUrl;

        } catch (Exception e) {
            // 실패하면 원본 URL로 fallback
            return u;
        }
    }

    private String followRedirects(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .timeout(Duration.ofSeconds(10))
                .header("User-Agent", "Mozilla/5.0")
                .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        // HttpClient가 Redirect.ALWAYS면 최종 URL로 도착함
        return res.uri().toString();
    }

    private boolean isNaverNews(String url) {
        return url.contains("n.news.naver.com") || url.contains("news.naver.com");
    }

    private boolean isGoogleNews(String url) {
        return url.contains("news.google.com");
    }

    /** ✅ 네이버: 원문 링크 추출 */
    private String resolveNaverOriginal(String naverUrl) throws Exception {
        Document doc = Jsoup.connect(naverUrl)
                .userAgent("Mozilla/5.0")
                .timeout(10000)
                .get();

        // 1) 대표적으로 잘 잡히는 셀렉터들
        // - 모바일 뉴스에는 종종 a[aria-label*=원문], a[href*=newspaper] 등이 섞여있음
        List<String> selectors = List.of(
                "a#article_origin_link",
                "a[href][class*=origin]",
                "a[href][aria-label*=원문]",
                "a[href]:matchesOwn(원문)",
                "a[href]:matchesOwn(원문보기)",
                "a[href]:matchesOwn(기사원문)",
                "a[href^=http]:matchesOwn(원문)"
        );

        for (String sel : selectors) {
            Element a = doc.selectFirst(sel);
            String href = absHref(a);
            if (isValidExternal(href)) return href;
        }

        // 2) meta / og / canonical에 원문이 박혀있는 경우(드묾)
        String og = meta(doc, "property", "og:url");
        if (isValidExternal(og) && !isNaverDomain(og)) return og;

        String canonical = doc.selectFirst("link[rel=canonical]") != null
                ? doc.selectFirst("link[rel=canonical]").absUrl("href") : null;
        if (isValidExternal(canonical) && !isNaverDomain(canonical)) return canonical;

        // 3) 전체 링크 중 "naver가 아닌" 링크를 점수 기반으로 뽑기
        return pickBestExternalLink(doc);
    }

    /** ✅ 구글뉴스: 원문 링크 추출 */
    private String resolveGoogleNewsOriginal(String googleUrl) throws Exception {
        Document doc = Jsoup.connect(googleUrl)
                .userAgent("Mozilla/5.0")
                .timeout(10000)
                .get();

        // 1) 간혹 query param에 url= 로 원문이 들어있는 케이스 처리
        String fromParam = extractUrlQueryParam(googleUrl, "url");
        if (isValidExternal(fromParam)) return fromParam;

        // 2) doc 안에서 google domain 아닌 외부 링크 중 최적 선택
        String picked = pickBestExternalLink(doc);
        if (isValidExternal(picked)) return picked;

        // 3) fallback: og/canonical
        String og = meta(doc, "property", "og:url");
        if (isValidExternal(og) && !isGoogleDomain(og)) return og;

        String canonical = doc.selectFirst("link[rel=canonical]") != null
                ? doc.selectFirst("link[rel=canonical]").absUrl("href") : null;
        if (isValidExternal(canonical) && !isGoogleDomain(canonical)) return canonical;

        return null;
    }

    private String meta(Document doc, String keyAttr, String keyVal) {
        Element m = doc.selectFirst("meta[" + keyAttr + "=" + keyVal + "]");
        return m == null ? null : m.attr("content");
    }

    private String absHref(Element a) {
        if (a == null) return null;
        String href = a.absUrl("href");
        if (href == null || href.isBlank()) href = a.attr("href");
        return (href == null || href.isBlank()) ? null : href.trim();
    }

    private boolean isValidExternal(String url) {
        return url != null && !url.isBlank() && (url.startsWith("http://") || url.startsWith("https://"));
    }

    private boolean isNaverDomain(String url) {
        return url.contains("naver.com");
    }

    private boolean isGoogleDomain(String url) {
        return url.contains("google.com") || url.contains("news.google.com");
    }

    /** 외부 링크 후보 중 “원문 가능성” 높은 것 고르기 */
    private String pickBestExternalLink(Document doc) {
        return doc.select("a[href]")
                .stream()
                .map(a -> a.absUrl("href"))
                .filter(this::isValidExternal)
                .filter(u -> !isNaverDomain(u))         // 네이버 내부는 원문이 아님
                .filter(u -> !isGoogleDomain(u))        // 구글뉴스 내부도 원문이 아님
                .filter(u -> u.length() > 20)
                .max(Comparator.comparingInt(this::scoreLink))
                .orElse(null);
    }

    /** 점수: 뉴스 본문 URL에서 흔한 패턴 가산점 */
    private int scoreLink(String u) {
        int s = 0;
        if (u.contains("news")) s += 3;
        if (u.contains("article")) s += 3;
        if (u.contains("read")) s += 1;
        if (u.matches(".*\\d{4,}.*")) s += 2; // 기사 id
        s += Math.min(u.length() / 30, 5); // 너무 짧은 링크 패널티
        return s;
    }

    private String extractUrlQueryParam(String url, String key) {
        try {
            URI uri = URI.create(url);
            String q = uri.getRawQuery();
            if (q == null) return null;
            for (String part : q.split("&")) {
                String[] kv = part.split("=", 2);
                if (kv.length == 2 && kv[0].equals(key)) {
                    return URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
