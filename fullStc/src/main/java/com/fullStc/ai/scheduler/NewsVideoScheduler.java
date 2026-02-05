package com.fullStc.ai.scheduler;

import com.fullStc.ai.dto.VideoTaskDTO;
import com.fullStc.ai.service.VideoService;
import com.fullStc.news.repository.NewsClusterRepository;
import com.fullStc.news.domain.NewsCluster;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Log4j2
public class NewsVideoScheduler {

    private final VideoService videoService;
    private final NewsClusterRepository newsClusterRepository;

    @Scheduled(cron = "0 0/10 * * * *")
    public void generateCategoryHotDigest() {

        String[] categories = {"politics", "economy", "society", "world", "it", "culture"};
        int index = (LocalTime.now().getMinute() / 10) % categories.length;
        String targetCategory = categories[index];

        log.info("[정기 예약] {} 카테고리 'HOT 3' 영상 제작 프로세스 시작", targetCategory);

        List<NewsCluster> hotClusters = newsClusterRepository.findTopHotClusters(
                targetCategory, PageRequest.of(0, 3));

        if (hotClusters.isEmpty()) {
            log.warn("⚠️ [{}] 카테고리에 제작할 수 있는 새로운 클러스터가 없습니다.", targetCategory);
            return;
        }

        StringBuilder digestText = new StringBuilder("오늘의 " + targetCategory + " 주요 소식입니다.\n\n");
        for (int i = 0; i < hotClusters.size(); i++) {
            digestText.append("이슈 ").append(i + 1).append(": ")
                      .append(hotClusters.get(i).getClusterSummary()).append("\n\n");
        }

        VideoTaskDTO dto = VideoTaskDTO.builder()
                .memberId(1L)
                .category(targetCategory)
                .rawText(digestText.toString())
                .customTitle("오늘의 " + targetCategory + " 핵심 요약")
                .videoMode("16:9")
                .isMainHot(true)
                .build();

        videoService.requestVideoGeneration(dto);
        log.info("✅ [{}] 영상 제작 요청이 성공적으로 큐에 등록되었습니다.", targetCategory);
    }
}