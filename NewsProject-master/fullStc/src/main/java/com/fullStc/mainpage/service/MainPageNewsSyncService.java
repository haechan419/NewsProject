package com.fullStc.mainpage.service;

import com.fullStc.mainpage.domain.MainPageNews;
import com.fullStc.mainpage.repository.MainPageNewsRepository;
import com.fullStc.news.domain.News;
import com.fullStc.news.repository.NewsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * News 엔티티와 MainPageNews 엔티티 간의 동기화 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MainPageNewsSyncService {

    private final NewsRepository newsRepository;
    private final MainPageNewsRepository mainPageNewsRepository;

    /**
     * News 엔티티의 데이터를 MainPageNews로 동기화
     * 최신 뉴스 중 title과 summary가 있는 것만 동기화
     */
    @Transactional
    public void syncNewsToMainPage() {
        log.info("News -> MainPageNews 동기화 시작");

        // 최근 1000개의 뉴스 중 title과 summary가 있는 것만 조회
        Pageable pageable = PageRequest.of(0, 1000);
        List<News> newsList = newsRepository.findAll(pageable).getContent()
                .stream()
                .filter(news -> news.getTitle() != null && !news.getTitle().isEmpty())
                .filter(news -> news.getSummary() != null && !news.getSummary().isEmpty())
                .toList();

        int syncedCount = 0;
        int updatedCount = 0;

        for (News news : newsList) {
            MainPageNews existingMainPageNews = mainPageNewsRepository.findByNewsId(news.getId());

            if (existingMainPageNews == null) {
                // 새로 생성
                MainPageNews mainPageNews = MainPageNews.builder()
                        .newsId(news.getId())
                        .title(news.getTitle())
                        .summary(news.getSummary())
                        .category(news.getCategory())
                        .url(news.getUrl())
                        .sourceName(news.getSourceName())
                        .publishedAt(news.getPublishedAt())
                        .viewCount(0L) // 초기값 0
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();

                mainPageNewsRepository.save(mainPageNews);
                syncedCount++;
            } else {
                // 기존 데이터 업데이트 (title, summary 등이 변경되었을 수 있음)
                existingMainPageNews.setTitle(news.getTitle());
                existingMainPageNews.setSummary(news.getSummary());
                existingMainPageNews.setCategory(news.getCategory());
                existingMainPageNews.setUrl(news.getUrl());
                existingMainPageNews.setSourceName(news.getSourceName());
                existingMainPageNews.setPublishedAt(news.getPublishedAt());
                existingMainPageNews.setUpdatedAt(Instant.now());

                mainPageNewsRepository.save(existingMainPageNews);
                updatedCount++;
            }
        }

        log.info("News -> MainPageNews 동기화 완료: 신규 {}개, 업데이트 {}개", syncedCount, updatedCount);
    }

    /**
     * 1시간마다 자동 동기화
     */
    @Scheduled(fixedRate = 3600000) // 1시간 = 3,600,000ms
    public void autoSync() {
        log.info("자동 동기화 시작");
        syncNewsToMainPage();
        log.info("자동 동기화 완료");
    }

    /**
     * 특정 News의 조회수 증가
     */
    @Transactional
    public void incrementViewCount(Long newsId) {
        MainPageNews mainPageNews = mainPageNewsRepository.findByNewsId(newsId);
        if (mainPageNews != null) {
            Long currentViewCount = mainPageNews.getViewCount() != null ? mainPageNews.getViewCount() : 0L;
            mainPageNews.setViewCount(currentViewCount + 1);
            mainPageNews.setUpdatedAt(Instant.now());
            mainPageNewsRepository.save(mainPageNews);
        }
    }
}
