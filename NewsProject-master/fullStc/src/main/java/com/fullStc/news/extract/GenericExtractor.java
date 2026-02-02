package com.fullStc.news.extract;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class GenericExtractor {

    public String extract(String url) throws Exception {
        Document doc = Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .timeout(9000)
                .followRedirects(true)
                .get();

        // 잡영역 제거
        doc.select("script, style, nav, footer, header, aside, iframe, form, noscript").remove();

        Element best = null;
        double bestScore = 0;

        for (Element e : doc.select("article, main, section, div")) {
            String text = normalize(e.text());
            if (text.length() < 250) continue;

            double score = score(text);
            if (score > bestScore) {
                bestScore = score;
                best = e;
            }
        }

        if (best == null) return null;

        String out = normalize(best.text());
        if (out.length() < 250) return null;
        return cap(out, 20000);
    }

    private String normalize(String s) {
        return s == null ? "" : s.replaceAll("\\s+", " ").trim();
    }

    private double score(String t) {
        int len = t.length();
        int sentences = t.split("[\\.\\!\\?…]|\\n").length;
        double kor = koreanRatio(t);
        // 길이 + 문장수 + 한글비율
        return len + sentences * 80.0 + kor * 600.0;
    }

    private double koreanRatio(String t) {
        int ko = 0, total = 0;
        for (int i = 0; i < t.length(); i++) {
            char c = t.charAt(i);
            if (Character.isWhitespace(c)) continue;
            total++;
            if (c >= 0xAC00 && c <= 0xD7A3) ko++;
        }
        return total == 0 ? 0 : (double) ko / total;
    }

    private String cap(String s, int max) {
        return s.length() > max ? s.substring(0, max) : s;
    }
}
