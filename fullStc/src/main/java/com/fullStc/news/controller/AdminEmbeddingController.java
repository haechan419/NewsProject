package com.fullStc.news.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.service.EmbeddingBatchService;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/embedding")
public class AdminEmbeddingController {

    private final EmbeddingBatchService embeddingBatchService;

    @PostMapping("/run")
    public Map<String, Object> run(@RequestParam(defaultValue = "100") int limit) {
        int updated = embeddingBatchService.fillEmbeddings(limit);
        return Map.of("embeddingFilled", updated);
    }
}
