package com.fullStc.news.controller;

import com.fullStc.news.service.ImageRegenerationService;
import com.fullStc.news.service.PollinationsImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageFailController {

    private final PollinationsImageService pollinationsImageService;

    @PostMapping("/fail/{clusterId}")
    public ResponseEntity<Void> reportFail(@PathVariable Long clusterId) {
        pollinationsImageService.retryGenerateAsync(clusterId);
        return ResponseEntity.ok().build();
    }
}


