package com.fullStc.news.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.dto.BriefingResponseDTO;
import com.fullStc.news.repository.NewsClusterRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 테스트용: 모든 프론트엔드 접속 허용 (나중에 http://localhost:3000 으로 변경 권장)
public class BriefingController {

    private final NewsClusterRepository newsClusterRepository;

    @GetMapping("/briefing")
    public List<BriefingResponseDTO> getBriefing() {
        // 1. DB에서 요약이 완료된 최신 20개 가져오기
        List<NewsCluster> clusters = newsClusterRepository.findTop20ByClusterSummaryIsNotNullOrderByIdDesc();

        // 2. 엔티티(Entity) -> DTO로 변환하기 (포장 작업)
        return clusters.stream()
                .map(BriefingResponseDTO::new) // 생성자에 하나씩 넣어서 변환
                .collect(Collectors.toList());
    }
}