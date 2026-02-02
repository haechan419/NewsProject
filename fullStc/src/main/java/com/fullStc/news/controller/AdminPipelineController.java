package com.fullStc.news.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.service.NewsPipelineService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/pipeline")
public class AdminPipelineController {

    private final NewsPipelineService pipelineService;
    @PostMapping("/run")
    public NewsPipelineService.PipelineResult run(
            @RequestParam(defaultValue = "20") int limit
    ) {
        return pipelineService.run(limit);
    }



}
