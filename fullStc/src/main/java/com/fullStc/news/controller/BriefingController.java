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

        String targetCategory = (category == null || category.isEmpty()) ? "economy" : category;

        // 1. [정석] AI가 요약해둔 데이터(NewsCluster) 가져오기
        List<NewsCluster> clusters = newsClusterRepository.findByCategoryNative(targetCategory);

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

// ★ [수정] 7번째 인자(이미지)를 추가합니다.
                        return new BriefingResponseDTO(
                                news.getId(),                     // 1. id
                                news.getTitle(),                  // 2. title
                                fakeSummary,                      // 3. summary
                                news.getCategory(),               // 4. category
                                news.getUrl(),                    // 5. originalUrl
                                news.getPublishedAt().toString(), // 6. date

                                // ★ [NEW] 7. image (클러스터에서 가져오기)
                                (news.getNewsCluster() != null) ? news.getNewsCluster().getImageUrl() : null
                        );
                    })
                    .collect(Collectors.toList());
        }

        // 3. 정석 데이터가 있으면 그대로 반환 (여긴 진짜 요약이 들어있음)
        return clusters.stream()
                .map(BriefingResponseDTO::new)
                .collect(Collectors.toList());
    }
}