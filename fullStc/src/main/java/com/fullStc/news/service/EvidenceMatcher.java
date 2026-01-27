package com.fullStc.news.service;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class EvidenceMatcher {
    private static final Pattern SENT_SPLIT = Pattern.compile("(?<=[.!?。]|다\\.|다\\?|다!|요\\.|요\\?|요!)\\s+");
    private static final Pattern TOK = Pattern.compile("[가-힣A-Za-z0-9]{2,}");

    public List<String> splitSentences(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(SENT_SPLIT.split(text.trim()))
                .map(String::trim).filter(s -> !s.isBlank()).toList();
    }

    public Match bestEvidence(String summarySentence, String content) {
        List<String> contentSents = splitSentences(content);
        Set<String> q = tokens(summarySentence);
        if (q.isEmpty() || contentSents.isEmpty()) return new Match(null, 0.0, "UNKNOWN");

        double best = 0.0;
        String bestText = null;

        for (String cs : contentSents) {
            double score = overlapScore(q, tokens(cs));
            if (score > best) { best = score; bestText = cs; }
        }

        String verdict = best >= 0.35 ? "ENTAILED" : "UNKNOWN";
        return new Match(bestText, best, verdict);
    }

    // ✅ 교차검증용: 제목/요약 간 유사도(토큰 overlap)
    public double titleSimilarity(String a, String b) {
        Set<String> ta = tokens(a);
        Set<String> tb = tokens(b);
        if (ta.isEmpty() || tb.isEmpty()) return 0.0;

        int hit = 0;
        for (String t : ta) if (tb.contains(t)) hit++;

        // a(쿼리) 기준 recall-ish
        return hit / (double) ta.size();
    }

    // ✅ 교차검증/디버그용으로 토큰 세트 노출
    public Set<String> tokensOf(String s) {
        return tokens(s);
    }

    private Set<String> tokens(String s) {
        if (s == null) return Set.of();
        var m = TOK.matcher(s);
        Set<String> out = new LinkedHashSet<>();
        while (m.find()) out.add(m.group().toLowerCase());
        return out;
    }

    private double overlapScore(Set<String> q, Set<String> d) {
        if (q.isEmpty() || d.isEmpty()) return 0;
        int hit = 0;
        for (String t : q) if (d.contains(t)) hit++;
        return hit / (double) q.size();
    }

    public record Match(String evidenceText, double score, String verdict) {}
}
