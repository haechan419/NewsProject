package com.fullStc.news.utils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class GoogleRssUrlDecoder {

    public static String tryDecodeToRealUrl(String rssUrl) {
        if (rssUrl == null) return null;
        String marker = "/rss/articles/";
        int idx = rssUrl.indexOf(marker);
        if (idx < 0) return null;

        String token = rssUrl.substring(idx + marker.length());
        int q = token.indexOf('?');
        if (q >= 0) token = token.substring(0, q);

        // token이 길어서 뒤에 붙는 &hl=... 같은거 제거한 상태임
        // URL-safe base64 padding 보정
        try {
            String padded = token;
            int mod = padded.length() % 4;
            if (mod != 0) padded += "=".repeat(4 - mod);

            byte[] decoded = Base64.getUrlDecoder().decode(padded);
            String s = new String(decoded, StandardCharsets.UTF_8);

            // 디코딩 문자열 안에서 https:// 찾기
            int h = s.indexOf("https://");
            if (h < 0) h = s.indexOf("http://");
            if (h < 0) return null;

            // URL 끝까지 대충 잘라내기(공백/제어문자/따옴표/특수 구분자 기준)
            int end = s.length();
            for (int i = h; i < s.length(); i++) {
                char c = s.charAt(i);
                if (Character.isWhitespace(c) || c == '"' || c == '\'' || c == '\\') {
                    end = i;
                    break;
                }
            }
            String real = s.substring(h, end).trim();
            if (real.startsWith("http")) return real;
            return null;

        } catch (Exception e) {
            return null;
        }
    }
}
