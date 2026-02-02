package com.fullStc.drive.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fullStc.drive.dto.DriveHistoryDto;
import com.fullStc.drive.dto.NewsItemDto;
import com.fullStc.drive.enums.HistoryStatus;
import com.fullStc.drive.entity.DriveHistory;
import com.fullStc.drive.repository.DriveHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HistoryServiceImpl implements HistoryService {
    
    private final DriveHistoryRepository driveHistoryRepository;
    private final TTSFileService ttsFileService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Override
    @Transactional
    public void recordHistory(Long userId, String newsId, String category, 
                             HistoryStatus status, Integer listenDuration, Boolean isRecommended, Integer lastSentenceIdx) {
        // 단일 뉴스 청취 이력을 플레이리스트 형태로 저장 (playlistId=newsId, newsList=단일 항목 JSON)
        List<NewsItemDto> singleNews = List.of(
                NewsItemDto.builder()
                        .newsId(newsId)
                        .category(category != null ? category : "")
                        .title("")
                        .summary("")
                        .build());
        String newsListJson;
        try {
            newsListJson = objectMapper.writeValueAsString(singleNews);
        } catch (JsonProcessingException e) {
            log.error("단일 뉴스 JSON 변환 실패: newsId={}", newsId, e);
            newsListJson = "[]";
        }
        DriveHistory history = DriveHistory.builder()
                .userId(userId)
                .playlistId(newsId)
                .playlistTitle(category != null ? category : "뉴스")
                .category(category != null ? category : "")
                .newsList(newsListJson)
                .status(status)
                .listenDuration(listenDuration != null ? listenDuration : 0)
                .currentTime(0)
                .newsId(newsId)
                .lastSentenceIdx(lastSentenceIdx != null ? lastSentenceIdx : 0)
                .build();
        driveHistoryRepository.save(history);
        log.debug("청취 이력 기록: userId={}, newsId(playlistId)={}, status={}, lastSentenceIdx(currentTime)={}", userId, newsId, status, lastSentenceIdx);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DriveHistoryDto> getHistory(Long userId) {
        List<DriveHistory> historyList = driveHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        List<DriveHistoryDto> dtoList = historyList.stream()
                .map(history -> {
                    List<NewsItemDto> newsList = new ArrayList<>();
                    if (history.getNewsList() != null && !history.getNewsList().isEmpty()) {
                        try {
                            newsList = objectMapper.readValue(
                                    history.getNewsList(),
                                    new TypeReference<List<NewsItemDto>>() {}
                            );
                        } catch (JsonProcessingException e) {
                            log.error("뉴스 목록 JSON 파싱 실패: historyId={}", history.getHistoryId(), e);
                        }
                    }
                    
                    return DriveHistoryDto.builder()
                            .historyId(history.getHistoryId())
                            .userId(history.getUserId())
                            .playlistId(history.getPlaylistId())
                            .playlistTitle(history.getPlaylistTitle())
                            .category(history.getCategory())
                            .newsList(newsList)
                            .status(history.getStatus())
                            .listenDuration(history.getListenDuration())
                            .currentTime(history.getCurrentTime())
                            .createdAt(history.getCreatedAt())
                            .lastSentenceIdx(history.getLastSentenceIdx())
                            .build();
                })
                .collect(Collectors.toList());
        
        log.debug("히스토리 조회: userId={}, count={}", userId, dtoList.size());
        return dtoList;
    }
    
    @Override
    @Transactional
    public void deleteHistory(Long historyId) {
        // TTS 파일 삭제 (즉시 삭제 정책)
        try {
            ttsFileService.deleteTTSFileByHistoryId(historyId);
        } catch (Exception e) {
            log.warn("히스토리 삭제 시 TTS 파일 삭제 실패: historyId={}, error={}", historyId, e.getMessage());
        }
        
        // 히스토리 삭제
        driveHistoryRepository.deleteById(historyId);
        log.debug("히스토리 삭제: historyId={}", historyId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public DriveHistoryDto getHistoryById(Long historyId) {
        return driveHistoryRepository.findById(historyId)
                .map(history -> {
                    List<NewsItemDto> newsList = new ArrayList<>();
                    if (history.getNewsList() != null && !history.getNewsList().isEmpty()) {
                        try {
                            newsList = objectMapper.readValue(
                                    history.getNewsList(),
                                    new TypeReference<List<NewsItemDto>>() {}
                            );
                        } catch (JsonProcessingException e) {
                            log.error("뉴스 목록 JSON 파싱 실패: historyId={}", historyId, e);
                        }
                    }
                    
                    return DriveHistoryDto.builder()
                            .historyId(history.getHistoryId())
                            .userId(history.getUserId())
                            .playlistId(history.getPlaylistId())
                            .playlistTitle(history.getPlaylistTitle())
                            .category(history.getCategory())
                            .newsList(newsList)
                            .status(history.getStatus())
                            .listenDuration(history.getListenDuration())
                            .currentTime(history.getCurrentTime())
                            .createdAt(history.getCreatedAt())
                            .lastSentenceIdx(history.getLastSentenceIdx())
                            .build();
                })
                .orElse(null);
    }
    
    @Override
    @Transactional
    public Long createPlaylistHistory(Long userId, String playlistId, String playlistTitle, 
                                     List<NewsItemDto> newsList) {
        if (newsList == null || newsList.isEmpty()) {
            throw new IllegalArgumentException("뉴스 목록이 비어있습니다");
        }
        
        String firstCategory = newsList.get(0).getCategory();
        
        List<NewsItemDto> newsItemList = newsList.stream()
                .map(item -> NewsItemDto.builder()
                        .newsId(item.getNewsId())
                        .title(item.getTitle())
                        .category(item.getCategory())
                        .summary(item.getSummary() != null ? item.getSummary() : "")
                        .build())
                .collect(Collectors.toList());
        
        String newsListJson;
        try {
            newsListJson = objectMapper.writeValueAsString(newsItemList);
        } catch (JsonProcessingException e) {
            log.error("뉴스 목록 JSON 변환 실패", e);
            newsListJson = "[]";
        }
        
        DriveHistory history = DriveHistory.builder()
                .userId(userId)
                .playlistId(playlistId)
                .playlistTitle(playlistTitle)
                .category(firstCategory)
                .newsList(newsListJson)
                .status(HistoryStatus.PLAY)
                .listenDuration(0)
                .currentTime(0)
                .isRecommended(false)
                .newsId(null)
                .build();
        
        DriveHistory saved = driveHistoryRepository.save(history);
        log.info("플레이리스트 히스토리 생성: historyId={}, userId={}, playlistId={}, playlistTitle={}, newsCount={}", 
                saved.getHistoryId(), userId, playlistId, playlistTitle, newsList.size());
        
        return saved.getHistoryId();
    }
    
    @Override
    @Transactional
    public void updatePlaylistHistory(Long historyId, HistoryStatus status, Integer currentTime, Integer listenDuration) {
        Optional<DriveHistory> historyOpt = driveHistoryRepository.findById(historyId);
        if (historyOpt.isPresent()) {
            DriveHistory history = historyOpt.get();
            history.setStatus(status);
            if (currentTime != null) {
                history.setCurrentTime(currentTime);
            }
            if (listenDuration != null) {
                history.setListenDuration(listenDuration);
            }
            driveHistoryRepository.save(history);
            log.info("플레이리스트 히스토리 업데이트: historyId={}, status={}, currentTime={}, listenDuration={}", 
                    historyId, status, currentTime, listenDuration);
        } else {
            log.warn("히스토리를 찾을 수 없음: historyId={}", historyId);
        }
    }
}
