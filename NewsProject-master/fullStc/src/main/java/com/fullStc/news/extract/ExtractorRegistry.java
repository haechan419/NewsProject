package com.fullStc.news.extract;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.fullStc.news.service.UrlResolverService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExtractorRegistry {

    private final List<ArticleExtractor> extractors;
    private final GenericExtractor fallback;
    private final UrlResolverService urlResolver;

    public ExtractResult extract(String url) {
        if (url == null || url.isBlank()) {
            return new ExtractResult(false, "none", null, "NO_URL");
        }

        String finalUrl = urlResolver.resolveFinalUrl(url);

        if (!finalUrl.equals(url)) {
            System.out.println("[EXTRACT] resolved url\n - from: " + url + "\n - to  : " + finalUrl);
        }

        // ✅ Google News RSS article은 본문 추출 소스가 아님(교차검증용이므로 스킵)
        if (finalUrl.contains("news.google.com/rss/articles") || finalUrl.contains("news.google.com/articles")) {
            System.out.println("[EXTRACT] google url -> skip: " + finalUrl);
            return new ExtractResult(false, "google-skip", null, "GOOGLE_SKIP");
        }

        for (ArticleExtractor ex : extractors) {
            if (!ex.supports(finalUrl)) continue;
            try {
                String content = ex.extract(finalUrl);
                if (content != null && content.length() >= 200) {
                    return new ExtractResult(true, ex.name(), content, null);
                } else {
                    System.out.println("[EXTRACT] extractor=" + ex.name() + " got too short. len="
                            + (content == null ? 0 : content.length()) + " url=" + finalUrl);
                }
            } catch (Exception e) {
                System.out.println("[EXTRACT] extractor=" + ex.name() + " failed: "
                        + e.getClass().getSimpleName() + " - " + e.getMessage());
            }
        }

        try {
            String content = fallback.extract(finalUrl);
            if (content != null && content.length() >= 200) {
                return new ExtractResult(true, "generic", content, null);
            }
            return new ExtractResult(false, "generic", null, "EMPTY");
        } catch (Exception e) {
            return new ExtractResult(false, "generic", null,
                    e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    public record ExtractResult(boolean ok, String extractor, String content, String error) {}
}
