package com.fullStc.news.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.domain.CategoryKeywords;
import com.fullStc.news.dto.NewsResponse;
import com.fullStc.news.service.NewsAggregatorService;
import com.fullStc.news.service.PipelineOrchestratorService;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {

    private final NewsAggregatorService aggregator;
    private final PipelineOrchestratorService pipeline;

    @GetMapping(produces = "application/json; charset=UTF-8")
    public NewsResponse getNews(
            @RequestParam(defaultValue = "top") String category,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String finalQuery = CategoryKeywords.buildQuery(category, query);

        // 1. 수집 및 저장
        NewsResponse response = aggregator.fetchAndSave(category, finalQuery, size);

        // 2. 파이프라인 가동 (비동기)
        // ★ [수정] .insertedIds() -> .getInsertedIds() (Lombok 문법)
        if (response.getInsertedIds() != null && !response.getInsertedIds().isEmpty()) {
            CompletableFuture.runAsync(() ->
                    pipeline.processNewOnly(response.getInsertedIds())
            );
        }

        // 3. 반환
        return response;
    }
}