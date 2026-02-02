package com.fullStc.drive.service;

import com.fullStc.drive.dto.DriveHistoryDto;
import com.fullStc.drive.dto.NewsItemDto;
import com.fullStc.drive.enums.HistoryStatus;

import java.util.List;

/**
 * 히스토리 관련 서비스 인터페이스
 */
public interface HistoryService {
    
    /**
     * 청취 이력 기록
     */
    void recordHistory(Long userId, String newsId, String category, 
                      HistoryStatus status, Integer listenDuration, Boolean isRecommended, Integer lastSentenceIdx);
    
    /**
     * 사용자 히스토리 조회
     */
    List<DriveHistoryDto> getHistory(Long userId);
    
    /**
     * 히스토리 삭제
     */
    void deleteHistory(Long historyId);
    
    /**
     * 히스토리 ID로 히스토리 조회
     */
    DriveHistoryDto getHistoryById(Long historyId);
    
    /**
     * 플레이리스트 히스토리 생성
     * @param userId 사용자 ID
     * @param playlistId 플레이리스트 ID
     * @param playlistTitle 플레이리스트 제목
     * @param newsList 뉴스 목록
     * @return 생성된 히스토리 ID
     */
    Long createPlaylistHistory(Long userId, String playlistId, String playlistTitle, 
                              List<NewsItemDto> newsList);
    
    /**
     * 플레이리스트 히스토리 업데이트 (재생 완료 시)
     * @param historyId 히스토리 ID
     * @param status 상태 (COMPLETED 등)
     * @param currentTime 마지막 재생 위치 (초)
     * @param listenDuration 총 청취 시간 (초)
     */
    void updatePlaylistHistory(Long historyId, HistoryStatus status, Integer currentTime, Integer listenDuration);
}
