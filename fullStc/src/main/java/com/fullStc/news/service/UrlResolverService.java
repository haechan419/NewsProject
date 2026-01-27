package com.fullStc.news.service;

import org.springframework.stereotype.Service;
import com.fullStc.news.utils.GoogleRssUrlDecoder;

import java.net.HttpURLConnection;
import java.net.URL;

@Service
public class UrlResolverService {

    /**
     * Google News RSS / 중계 링크 등: 리다이렉트를 따라가 최종 URL을 얻는다.
     * 실패하면 원래 url 반환.
     */
    public String resolveFinalUrl(String url) {
        if (url == null || url.isBlank()) return url;
        String cur = url.trim();

        // 0) google rss 토큰 디코딩 우선 시도
        String decoded = GoogleRssUrlDecoder.tryDecodeToRealUrl(cur);
        if (decoded != null) {
            System.out.println("[RESOLVE] google rss decoded -> " + decoded);
            cur = decoded;
        }


        try {
            for (int i = 0; i < 8; i++) {
                HttpURLConnection conn = (HttpURLConnection) new URL(cur).openConnection();
                conn.setInstanceFollowRedirects(false);
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0");

                int code = conn.getResponseCode();
                if (code >= 300 && code < 400) {
                    String loc = conn.getHeaderField("Location");
                    if (loc == null || loc.isBlank()) break;
                    cur = loc;
                    continue;
                }
                break;
            }
            return cur;
        } catch (Exception e) {
            return url;
        }
    }
}
