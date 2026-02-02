package com.fullStc.news.extract;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class NaverExtractor implements ArticleExtractor {

    @Override
    public boolean supports(String url) {
        return url != null && url.contains("n.news.naver.com");
    }

    @Override
    public String extract(String url) throws Exception {
        Document doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .timeout(8000)
                .followRedirects(true)
                .get();

        Element body = doc.selectFirst("#dic_area"); // 네이버 모바일 본문
        if (body == null) return null;

        String text = normalize(body.text());
        if (text.length() < 200) return null;
        return cap(text, 20000);
    }

    @Override
    public String name() {
        return "naver";
    }

    private String normalize(String s) {
        return s == null ? "" : s.replaceAll("\\s+", " ").trim();
    }

    private String cap(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }
}
