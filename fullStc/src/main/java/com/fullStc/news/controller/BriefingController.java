package com.fullStc.news.controller;

import com.fullStc.news.domain.News;
import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.dto.BriefingResponseDTO;
import com.fullStc.news.repository.NewsClusterRepository;
import com.fullStc.news.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class BriefingController {

    private final NewsClusterRepository newsClusterRepository;
    private final NewsRepository newsRepository;

    @GetMapping("/briefing")
    public List<BriefingResponseDTO> getBriefing(@RequestParam(required = false) String category) {

        // 카테고리가 없으면 기본값 'economy'
        String targetCategory = (category == null || category.isEmpty()) ? "economy" : category;

        // =================================================================
        // 1. [정석] AI가 요약해둔 데이터(NewsCluster) 가져오기
        // ★ [핵심 수정] 아까 만든 '최신순(OrderByIdDesc)' 메소드를 여기서 씁니다!
        // =================================================================
        List<NewsCluster> clusters;

        if ("all".equals(targetCategory)) {
            // 만약 카테고리가 'all'이면 전체 최신순 조회 (Repository에 findAllByOrderByIdDesc가 있다면 사용)
            clusters = newsClusterRepository.findAllByOrderByIdDesc();
        } else {
            // 특정 카테고리 최신순 조회
            clusters = newsClusterRepository.findByCategoryOrderByIdDesc(targetCategory);
        }

        // 2. [비상 대책] 요약된 게 없으면? -> 원본 뉴스(News)를 가져와서 "가짜 요약" 만들기
        if (clusters.isEmpty()) {
            System.out.println("🚨 [" + targetCategory + "] 요약본 없음! 원본 뉴스 앞부분을 잘라서 보여줍니다.");

            List<News> rawNews = newsRepository.findTop10ByCategoryOrderByPublishedAtDesc(targetCategory);

            return rawNews.stream()
                    .map(news -> {
                        String content = news.getContent();
                        String fakeSummary = "요약 중입니다... " +
                                ((content != null && content.length() > 150)
                                        ? content.substring(0, 150) + "..."
                                        : content);

                        return new BriefingResponseDTO(
                                news.getId(),
                                news.getTitle(),
                                fakeSummary,
                                news.getCategory(),
                                news.getUrl(),
                                news.getPublishedAt().toString(),

                                // ★ [이미지 연결] 클러스터가 있으면 이미지를 가져오고, 없으면 null
                                (news.getNewsCluster() != null) ? news.getNewsCluster().getImageUrl() : null
                        );
                    })
                    .collect(Collectors.toList());
        }

        // 3. 정석 데이터 반환 (DTO 변환)
        return clusters.stream()
                .map(BriefingResponseDTO::new)
                .collect(Collectors.toList());
    }
}