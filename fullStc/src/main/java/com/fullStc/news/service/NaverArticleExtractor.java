package com.fullStc.news.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Component;
import com.fullStc.news.extract.ArticleExtractor;

@Component
public class NaverArticleExtractor implements ArticleExtractor {

    @Override public String name() { return "naver"; }

    @Override
    public boolean supports(String url) {
        if (url == null) return false;
        return url.contains("n.news.naver.com") || url.contains("news.naver.com");
    }

    @Override
    public String extract(String url) throws Exception {
        Document doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .timeout(10000)
                .followRedirects(true)
                .get();

        String text = doc.select("#dic_area").text();
        if (text == null || text.isBlank()) text = doc.select("article").text();
        return text;
    }
}
