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

    /* 10분마다 실행, 각 카테고리별 HOT 이슈 영상제작 요청*/
    @Scheduled(cron = "0 0/15 * * * *")
    public void generateCategoryHotDigest() {

        String[] categories = { "politics", "economy", "society", "world", "it", "culture" };

        int index = (LocalTime.now().getMinute() / 10) % categories.length;
        String targetCategory = categories[index];

        log.info("[정기 예약] {} 카테고리 'HOT 3' 영상 제작 프로세스 시작", targetCategory);

        List<NewsCluster> hotClusters = newsClusterRepository.findTopHotClusters(
                targetCategory, PageRequest.of(0, 3));

        if (hotClusters.isEmpty()) {
            log.warn("⚠️ [{}] 카테고리에 제작할 수 있는 새로운 클러스터가 없습니다.", targetCategory);
            return;
        }


        String catchyTitle = hotClusters.get(0).getClusterSummary();
        
        if (catchyTitle != null && catchyTitle.length() > 25) {
            catchyTitle = catchyTitle.substring(0, 22) + "...";
        } else if (catchyTitle == null) {
            catchyTitle = "오늘의 " + targetCategory + " 주요 소식";
        }

        StringBuilder digestText = new StringBuilder("오늘의 " + targetCategory + " 주요 소식입니다.\n\n");
        for (int i = 0; i < hotClusters.size(); i++) {
            digestText.append("이슈 ").append(i + 1).append(": ")
                    .append(hotClusters.get(i).getClusterSummary()).append("\n\n");
        }

        // 비디오 제작 요청 DTO 생성 
        VideoTaskDTO dto = VideoTaskDTO.builder()
                .memberId(1L) // 관리자 ID
                .category(targetCategory)
                .rawText(digestText.toString())
                .customTitle(catchyTitle)
                .videoMode("16:9") 
                .isMainHot(true)  
                .build();

        videoService.requestVideoGeneration(dto);
        
        log.info("✅ [{}] 영상 제작 요청 성공. 제목: {}", targetCategory, catchyTitle);
    }
}