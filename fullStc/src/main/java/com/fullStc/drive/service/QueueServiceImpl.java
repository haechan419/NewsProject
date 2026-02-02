package com.fullStc.drive.service;

import com.fullStc.drive.dto.NewsQueueResponse;
import com.fullStc.drive.dto.NewsSummaryDto;
import com.fullStc.drive.repository.DriveHistoryRepository;
import com.fullStc.drive.util.MockNewsData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueueServiceImpl implements QueueService {
    
    private final DriveHistoryRepository driveHistoryRepository;
    
    @Override
    public NewsQueueResponse generateNewsQueue(Long userId) {
        // TODO: 실제 구현 시 다른 팀원의 integrated_summary 테이블과 연동
        
        // Mock 데이터: 2+1 알고리즘
        // Personal (2개) - 사용자 관심 카테고리에서 추출
        List<NewsSummaryDto> personalNews = new ArrayList<>();
        
        // 사용자의 완독률이 높은 카테고리 조회
        List<Object[]> topCategories = driveHistoryRepository.findTopCategoriesByUserId(userId);
        
        // 기본 카테고리 목록 (다양성 확보)
        List<String> defaultCategories = Arrays.asList("IT", "경제", "정치", "사회");
        Set<String> usedCategories = new HashSet<>();
        
        if (topCategories.isEmpty()) {
            // 이력이 없으면 기본 카테고리 사용 (다양하게)
            personalNews.add(MockNewsData.getRandomNewsByCategory("IT"));
            usedCategories.add("IT");
            personalNews.add(MockNewsData.getRandomNewsByCategory("경제"));
            usedCategories.add("경제");
        } else {
            // 상위 2개 카테고리에서 각각 1개씩
            for (int i = 0; i < Math.min(2, topCategories.size()); i++) {
                String category = (String) topCategories.get(i)[0];
                personalNews.add(MockNewsData.getRandomNewsByCategory(category));
                usedCategories.add(category);
            }
            
            // 2개 미만이면 기본 카테고리로 채움 (사용하지 않은 카테고리 우선)
            while (personalNews.size() < 2) {
                for (String category : defaultCategories) {
                    if (!usedCategories.contains(category)) {
                        personalNews.add(MockNewsData.getRandomNewsByCategory(category));
                        usedCategories.add(category);
                        break;
                    }
                }
                // 모든 기본 카테고리를 사용했으면 IT로 채움
                if (personalNews.size() < 2) {
                    personalNews.add(MockNewsData.getRandomNewsByCategory("IT"));
                }
            }
        }
        
        // Hot/Breaking (1개) - 전체 시스템에서 가장 인기 있는 뉴스
        NewsSummaryDto hotNews = MockNewsData.getRandomHotNews();
        // Hot 뉴스는 isHot=true로 이미 설정되어 있음
        
        log.info("뉴스 큐 생성 완료: userId={}, personalNews={}개, hotNews={}, totalCount={}", 
                userId, personalNews.size(), hotNews != null ? hotNews.getNewsId() : "null", 3);
        log.debug("Personal 뉴스 목록: {}", personalNews.stream()
                .map(n -> String.format("%s(%s)", n.getNewsId(), n.getCategory()))
                .collect(java.util.stream.Collectors.joining(", ")));
        if (hotNews != null) {
            log.debug("Hot 뉴스: {} ({})", hotNews.getNewsId(), hotNews.getCategory());
        }
        
        return NewsQueueResponse.builder()
                .personalNews(personalNews)
                .hotNews(hotNews)
                .totalCount(3)
                .build();
    }
}
