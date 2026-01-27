package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import com.fullStc.news.domain.News;
import com.fullStc.news.repository.NewsRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class KeywordClusterService {

    private final NewsRepository newsRepository;
    private final NewsClusterStoreService clusterStore;
    private final KeywordClusterStoreService keywordClusterStore; // ✅ 타입/이름 수정

    private static final java.util.regex.Pattern TOK =
            java.util.regex.Pattern.compile("[가-힣A-Za-z0-9]{2,}");
    private static final Set<String> STOP = Set.of(
            "기자","단독","속보","오늘","이번","관련","대한","그리고","하지만","있다","했다","한다",
            "the","and","for","with","from","that","this","you","your"
    );

    // ✅ @Transactional 굳이 필요 없음 (저장은 REQUIRES_NEW로 분리됨)
    public int clusterByKeywords(int limit) {
        List<News> list = newsRepository.findForKeywordClustering(PageRequest.of(0, limit));
        if (list.isEmpty()) return 0;

        int updated = 0;

        for (News n : list) {
            String key = keywordKey(n.getTitle(), null);
            if (key.isBlank()) continue;

            String clusterKey = sha256_64((n.getCategory()==null?"":n.getCategory()) + "|" + key);

            long clusterId = clusterStore.upsertCluster(
                    clusterKey,
                    n.getCategory(),
                    n.getId(),
                    n.getTitle(),
                    null,
                    "[]",
                    null
            );

            keywordClusterStore.saveDupClusterId(n.getId(), clusterId);
            updated++;
        }

        return updated;
    }

    private String keywordKey(String title, String content) {
        String text = ((title==null?"":title) + "\n" + (content==null?"":content));
        var m = TOK.matcher(text.toLowerCase());
        Map<String,Integer> freq = new HashMap<>();

        while (m.find()) {
            String t = m.group();
            if (STOP.contains(t)) continue;

            // ✅ 분산 원인 컷 (최소 튜닝 3개)
            if (t.chars().allMatch(Character::isDigit)) continue;
            if (t.length() > 12) continue;

            freq.put(t, freq.getOrDefault(t,0)+1);
        }

        return freq.entrySet().stream()
                .sorted((a,b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(2)      // ✅ 8 -> 5
                .map(Map.Entry::getKey)
                .sorted()
                .reduce((a,b) -> a + "," + b)
                .orElse("");
    }

    private String sha256_64(String s) {
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest(s.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 32; i++) sb.append(String.format("%02x", h[i]));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
