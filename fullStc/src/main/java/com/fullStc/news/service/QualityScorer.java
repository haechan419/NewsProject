package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import com.fullStc.news.domain.News;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class QualityScorer {
    private final EvidenceMatcher matcher;

    public Result scoreCluster(List<News> clusterItems) {
        Set<String> flags = new LinkedHashSet<>();

        long sourceCnt = clusterItems.stream()
                .map(News::getSourceName).filter(Objects::nonNull)
                .map(String::trim).filter(s -> !s.isBlank())
                .distinct().count();
        if (sourceCnt <= 1) flags.add("LOW_CROSS_SOURCE");

        int total = 0;
        int entailed = 0;
        boolean titleMismatch = false;

        for (News n : clusterItems) {
            // title-body mismatch (간단)
            if (isTitleBodyMismatch(n.getTitle(), n.getContent())) titleMismatch = true;

            List<String> sumSents = matcher.splitSentences(n.getAiSummary());
            total += sumSents.size();
            for (String ss : sumSents) {
                EvidenceMatcher.Match m = matcher.bestEvidence(ss, n.getContent());
                if ("ENTAILED".equals(m.verdict())) entailed++;
            }
        }

        double entailRatio = (total == 0) ? 0.0 : entailed / (double) total;
        if (entailRatio < 0.6) flags.add("NO_EVIDENCE");
        if (titleMismatch) flags.add("TITLE_BODY_MISMATCH");

        int score = 100;
        score -= (int) ((1.0 - entailRatio) * 60); // 근거율이 낮을수록 큰 감점
        if (flags.contains("TITLE_BODY_MISMATCH")) score -= 15;
        if (flags.contains("LOW_CROSS_SOURCE")) score -= 10;
        score = Math.max(0, Math.min(100, score));

        String badge = score >= 80 ? "✅" : (score >= 50 ? "⚠️" : "❌");
        return new Result(score, flags, badge, entailRatio);
    }

    private boolean isTitleBodyMismatch(String title, String content) {
        if (title == null || content == null) return false;
        Set<String> t = simpleTokens(title);
        if (t.isEmpty()) return false;
        Set<String> c = simpleTokens(content);
        int hit = 0;
        for (String w : t) if (c.contains(w)) hit++;
        double r = hit / (double) t.size();
        return r < 0.25;
    }

    private Set<String> simpleTokens(String s) {
        if (s == null) return Set.of();
        var m = Pattern.compile("[가-힣A-Za-z0-9]{2,}").matcher(s);
        Set<String> out = new LinkedHashSet<>();
        while (m.find()) out.add(m.group().toLowerCase());
        return out;
    }

    public record Result(int score, Set<String> flags, String badge, double entailRatio) {
        public String flagsJson() {
            // 아주 간단 JSON 배열
            return flags.stream()
                    .map(f -> "\"" + f + "\"")
                    .collect(Collectors.joining(",", "[", "]"));
        }
    }
}
