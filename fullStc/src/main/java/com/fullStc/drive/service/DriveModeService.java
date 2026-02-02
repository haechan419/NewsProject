package com.fullStc.drive.service;

import com.fullStc.drive.dto.*;
import com.fullStc.drive.enums.HistoryStatus;

import java.util.List;

public interface DriveModeService {
    
    /**
     * 드라이브 모드 진입 시나리오 판별 (3시간 규칙)
     */
    EntryScenarioResponse getEntryScenario(Long userId);
    
    /**
     * 2+1 알고리즘: 개인화 뉴스 큐 생성
     */
    NewsQueueResponse generateNewsQueue(Long userId);
    
    /**
     * 하이브리드 명령어 분석 (1단계: Java 로컬 필터링)
     */
    CommandIntentResponse analyzeCommand(String rawText, Long userId);
    
    /**
     * 재생 상태 동기화 (5초 주기)
     */
    void syncPlaybackState(Long userId, String playlistId, Integer currentTime);
    
    /**
     * 드라이브 모드 활성화/비활성화
     */
    void setDriveModeActive(Long userId, Boolean isActive);
    
    /**
     * 사용자 설정 조회
     */
    DriveSettingsDto getSettings(Long userId);
    
    /**
     * 사용자 설정 업데이트
     */
    DriveSettingsDto updateSettings(Long userId, DriveSettingsDto dto);
    
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
     * 히스토리 ID로 히스토리 조회
     */
    DriveHistoryDto getHistoryById(Long historyId);

    /** TTS 생성용 뉴스 목록 (historyId → NewsItemDto 리스트, 없으면 null) */
    List<NewsItemDto> getNewsListForTTS(Long historyId);
    
    /**
     * 히스토리 TTS 재생 (오디오 파일 반환)
     * @param historyId 히스토리 ID
     * @return 오디오 바이너리 데이터
     */
    byte[] getHistoryTTS(Long historyId);
    
    /**
     * 플레이리스트 히스토리 업데이트 (재생 완료 시)
     * @param historyId 히스토리 ID
     * @param status 상태 (COMPLETED 등)
     * @param currentTime 마지막 재생 위치 (초)
     * @param listenDuration 총 청취 시간 (초)
     */
    void updatePlaylistHistory(Long historyId, HistoryStatus status, Integer currentTime, Integer listenDuration);
    
    /**
     * 히스토리 삭제
     */
    void deleteHistory(Long historyId);
    
    /**
     * 명령 로그 기록
     */
    void logCommand(Long userId, String rawText, String intent, Float confScore, Boolean isSuccess, String errorMsg);
    
    /**
     * TTS: 텍스트를 오디오로 변환
     * @param text 변환할 텍스트
     * @param voiceType 목소리 타입
     * @param speed 재생 속도
     * @param newsId 뉴스 ID (이어듣기 시 기존 파일 조회용, 선택적)
     */
    byte[] generateTTS(String text, String voiceType, Float speed, String newsId);
    
    /**
     * 뉴스 텍스트 조회 (이어듣기 지원)
     * @param newsId 뉴스 ID
     * @param startSentenceIdx 시작 문장 인덱스 (이어듣기용, 선택적)
     * @return 뉴스 텍스트 (startSentenceIdx가 있으면 해당 인덱스부터)
     */
    String getNewsText(String newsId, Integer startSentenceIdx);
    
    /**
     * TTS URL 생성
     * @param text TTS로 변환할 텍스트
     * @param voiceType 목소리 타입
     * @param speed 재생 속도
     * @return TTS URL
     */
    String generateTTSUrl(String text, String voiceType, Float speed);

    /**
     * 플레이리스트 목록 조회
     * @param userId 사용자 ID
     * @return 플레이리스트 메타데이터 목록
     */
    List<PlaylistMetadataDto> getPlaylists(Long userId);

    /**
     * 플레이리스트 선택 및 뉴스 조회
     * @param userId 사용자 ID
     * @param playlistId 플레이리스트 ID
     * @return 플레이리스트 선택 응답 (뉴스 목록, 히스토리 ID, 오디오 URL)
     */
    PlaylistSelectionResponse selectPlaylist(Long userId, String playlistId);
}
