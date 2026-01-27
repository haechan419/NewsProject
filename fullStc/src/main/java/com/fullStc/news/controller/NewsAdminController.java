package com.fullStc.news.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.service.NewsQualityService;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/news")
public class NewsAdminController {

    private final NewsQualityService qualityService;

    @PostMapping("/quality/run")
    public Map<String, Object> run(@RequestParam(defaultValue = "50") int limit) {
        qualityService.runQualityPipeline(limit);
        return Map.of("ok", true, "limit", limit);
    }
}

