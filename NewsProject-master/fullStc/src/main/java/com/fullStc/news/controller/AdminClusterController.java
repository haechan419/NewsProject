package com.fullStc.news.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.service.KeywordClusterService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/cluster")
public class AdminClusterController {

    private final KeywordClusterService keywordClusterService;

    @PostMapping("/keywords")
    public int runKeywordCluster(@RequestParam(defaultValue = "20") int limit) {
        return keywordClusterService.clusterByKeywords(limit);
    }
}
