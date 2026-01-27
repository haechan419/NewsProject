package com.fullStc.news.controller; // 패키지명 확인

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.service.RepresentativeSummaryService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/summary")
public class AdminSummaryController {

    private final RepresentativeSummaryService repSummaryService;

//    // 1. (기존) 단일 기사 요약 - 필요 없으면 지워도 됨
//    @PostMapping("/rep/run")
//    public String runSingle(@RequestParam(defaultValue = "10") int limit) {
//        int updated = repSummaryService.generateRepresentativeSummaries(limit);
//        return "OK (Single News) updated=" + updated;
//    }

    // 2. ★ [NEW] 클러스터(그룹) 요약 강제 실행
    // 사용법: POST /admin/summary/cluster/run?ids=10,11,12
    @PostMapping("/cluster/run")
    public String runCluster(
            @RequestParam List<Long> ids, // 요약하고 싶은 클러스터 ID 목록
            @RequestParam(defaultValue = "10") int limit
    ) {
        int updated = repSummaryService.generateRepresentativeSummariesForClusterIds(ids, limit);
        return "OK (Cluster Summary) updated=" + updated;
    }
}