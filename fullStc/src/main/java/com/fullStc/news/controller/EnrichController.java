package com.fullStc.news.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.service.NaverEnrichService;
import com.fullStc.news.service.RssEnrichService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/enrich")
public class EnrichController {

    private final NaverEnrichService enrichService;

    @PostMapping("/run")
    public NaverEnrichService.EnrichResult run(@RequestParam(defaultValue = "20") int limit) {
        return enrichService.enrich(limit);
    }

    private final RssEnrichService rssEnrichService; // 주입 필요

    @PostMapping("/rss") // RSS 전용 수동 트리거
    public String runRssEnrich(@RequestParam(defaultValue = "50") int limit) {
        rssEnrichService.enrich(limit);
        return "RSS Enrich Started for " + limit + " items";

    }

}
