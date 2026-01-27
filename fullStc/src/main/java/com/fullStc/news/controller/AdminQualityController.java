package com.fullStc.news.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.service.NewsQualityPythonService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/quality")
public class AdminQualityController {

    private final NewsQualityPythonService qualityPythonService;

    @PostMapping("/run")
    public String run(@RequestParam(defaultValue = "50") int limit) {
        int n = qualityPythonService.runQualityWithClustering(limit);
        System.out.println("[QUALITY] service=" + qualityPythonService.getClass().getName());
        return "OK updated=" + n;

    }
}
