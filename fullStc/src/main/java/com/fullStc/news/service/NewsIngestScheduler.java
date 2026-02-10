package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NewsIngestScheduler {

    private final PipelineOrchestratorService pipeline;

    // 카테고리 목록
    private final List<String> categories = List.of(
            "it", "economy", "society", "politics", "world", "culture"
    );

    private int index = 0;

    // 2분마다 실행
    @Scheduled(fixedDelay = 120000)
    public void ingest() {
        String category = categories.get(index);

        try {
            log.info("🎬 [AUTO] 스케줄러 가동! 이번 타자: '{}'", category);

            // processNewNews로 통일
            pipeline.processNewNews(category);

            log.info("✅ [AUTO] '{}' 처리 완료.", category);

        } catch (Exception e) {
            log.error("💥 [AUTO] '{}' 실패: {}", category, e.getMessage());
        }

        index = (index + 1) % categories.size();
    }
}