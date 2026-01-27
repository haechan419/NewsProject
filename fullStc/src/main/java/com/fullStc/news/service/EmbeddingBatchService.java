package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.fullStc.news.domain.News;
import com.fullStc.news.provider.OpenAiEmbedder;
import com.fullStc.news.repository.NewsRepository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmbeddingBatchService {

    private final NewsRepository newsRepository;
    private final OpenAiEmbedder embedder;
    private final VectorCodec vectorCodec;
    private final JdbcTemplate jdbc; // ★ 이걸로 직접 저장해야 확실함

    // 기존 호환용
    public int fillEmbeddings(int limit) {
        // 읽어올 때만 짧게 트랜잭션 걸리거나, Repository에서 처리
        List<News> targets = newsRepository.findWithoutEmbedding(limit);
        return fillEmbeddingsInternal(targets);
    }

    // NEW-only 파이프라인용
    public int fillEmbeddingsForIds(List<Long> ids, int limit) {
        if (ids == null || ids.isEmpty()) return 0;
        List<News> targets = newsRepository.findWithoutEmbeddingByIds(ids, limit);
        return fillEmbeddingsInternal(targets);
    }

    // ★ 핵심 로직: 트랜잭션 없이 한 땀 한 땀 저장
    private int fillEmbeddingsInternal(List<News> targets) {
        if (targets == null || targets.isEmpty()) return 0;

        int ok = 0;
        int fail = 0;

        log.info("[EMBEDDING] Start processing {} items...", targets.size());

        for (News n : targets) {
            try {
                // 1. 텍스트 준비 (요약 우선, 없으면 본문 앞부분)
                String base;
                if (n.getAiSummary() != null && !n.getAiSummary().isBlank()) {
                    base = n.getAiSummary();
                } else if (n.getContent() != null && !n.getContent().isBlank()) {
                    String c = n.getContent();
                    // 토큰 제한 방지 (1200자 컷)
                    if (c.length() > 1200) c = c.substring(0, 1200);
                    base = (n.getTitle() == null ? "" : n.getTitle()) + "\n" + c;
                } else {
                    log.warn("[EMBEDDING SKIP] No content for ID={}", n.getId());
                    continue;
                }

                // 2. OpenAI 호출 (시간 걸림)
                float[] v = embedder.embed(base);
                if (v == null || v.length == 0) {
                    throw new RuntimeException("Embedding result is empty");
                }
                String json = vectorCodec.toJson(v);
                Instant now = Instant.now();

                // 3. ★ [핵심] JDBC로 즉시 강제 저장 (기다리지 않음)
                jdbc.update("UPDATE news SET embedding = ?, embedding_at = ? WHERE id = ?",
                        json, Timestamp.from(now), n.getId());

                ok++;
                // log.info("[EMB OK] ID={}", n.getId()); // 너무 시끄러우면 주석 처리

            } catch (Exception e) {
                fail++;
                log.error("[EMB FAIL] ID={} Msg={}", n.getId(), e.getMessage());
            }
        }

        log.info("[EMBEDDING FINISHED] Success={} Failed={}", ok, fail);
        return ok;
    }
}