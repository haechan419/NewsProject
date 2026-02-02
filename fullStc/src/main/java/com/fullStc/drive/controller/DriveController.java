package com.fullStc.drive.controller;

import com.fullStc.drive.dto.*;
import com.fullStc.drive.enums.HistoryStatus;
import com.fullStc.drive.service.DriveModeService;
import com.fullStc.drive.service.VoiceProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/drive")
@RequiredArgsConstructor
public class DriveController {

    private final DriveModeService driveModeService;
    private final VoiceProcessingService voiceProcessingService;

    /**
     * 드라이브 모드 진입 (플레이리스트 선택 화면)
     */
    @GetMapping("/entry/{userId}")
    public ResponseEntity<DriveEntryResponse> enterDriveMode(@PathVariable Long userId) {
        EntryScenarioResponse scenario = driveModeService.getEntryScenario(userId);
        
        DriveEntryResponse response = DriveEntryResponse.builder()
                .scenario(scenario.getScenario())
                .build();
        
        return ResponseEntity.ok(response);
    }

    /**
     * 뉴스 큐 생성 (2+1 알고리즘)
     */
    @GetMapping("/queue/{userId}")
    public ResponseEntity<NewsQueueResponse> getNewsQueue(@PathVariable Long userId) {
        return ResponseEntity.ok(driveModeService.generateNewsQueue(userId));
    }

    /**
     * 재생 상태 동기화 (5초 주기)
     */
    @PatchMapping("/playback/sync")
    public ResponseEntity<Void> syncPlaybackState(
            @RequestParam Long userId,
            @RequestParam String playlistId,
            @RequestParam Integer currentTime) {
        driveModeService.syncPlaybackState(userId, playlistId, currentTime);
        return ResponseEntity.ok().build();
    }

    /**
     * 드라이브 모드 활성화/비활성화
     */
    @PatchMapping("/active/{userId}")
    public ResponseEntity<Void> setDriveModeActive(
            @PathVariable Long userId,
            @RequestParam Boolean isActive) {
        driveModeService.setDriveModeActive(userId, isActive);
        return ResponseEntity.ok().build();
    }

    /**
     * 사용자 설정 조회
     */
    @GetMapping("/settings/{userId}")
    public ResponseEntity<DriveSettingsDto> getSettings(@PathVariable Long userId) {
        DriveSettingsDto dto = driveModeService.getSettings(userId);
        return ResponseEntity.ok(dto);
    }

    /**
     * 사용자 설정 업데이트
     */
    @PutMapping("/settings/{userId}")
    public ResponseEntity<DriveSettingsDto> updateSettings(
            @PathVariable Long userId,
            @Valid @RequestBody DriveSettingsDto dto) {
        DriveSettingsDto updated = driveModeService.updateSettings(userId, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * 청취 이력 기록
     */
    @PostMapping("/history")
    public ResponseEntity<Void> recordHistory(
            @RequestParam Long userId,
            @RequestParam String newsId,
            @RequestParam String category,
            @RequestParam String status,
            @RequestParam Integer listenDuration,
            @RequestParam(required = false, defaultValue = "false") Boolean isRecommended,
            @RequestParam(required = false) Integer lastSentenceIdx) {
        HistoryStatus historyStatus = HistoryStatus.valueOf(status);
        driveModeService.recordHistory(userId, newsId, category, historyStatus, listenDuration, isRecommended, lastSentenceIdx);
        return ResponseEntity.ok().build();
    }

    /**
     * 플레이리스트 목록 조회
     */
    @GetMapping("/playlists/{userId}")
    public ResponseEntity<List<PlaylistMetadataDto>> getPlaylists(@PathVariable Long userId) {
        List<PlaylistMetadataDto> playlists = driveModeService.getPlaylists(userId);
        return ResponseEntity.ok(playlists);
    }

    /**
     * 플레이리스트 선택 및 뉴스 조회
     */
    @PostMapping("/select-playlist")
    public ResponseEntity<PlaylistSelectionResponse> selectPlaylist(
            @RequestParam Long userId,
            @Valid @RequestBody PlaylistSelectionRequest request) {
        PlaylistSelectionResponse response = driveModeService.selectPlaylist(userId, request.getPlaylistId());
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자별 히스토리 목록 조회 (userId로 구분하여 단건 조회와 경로 충돌 방지)
     */
    @GetMapping("/history/user/{userId}")
    public ResponseEntity<List<DriveHistoryDto>> getHistory(@PathVariable Long userId) {
        List<DriveHistoryDto> history = driveModeService.getHistory(userId);
        return ResponseEntity.ok(history);
    }

    /**
     * 히스토리 삭제
     */
    @DeleteMapping("/history/{historyId}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long historyId) {
        driveModeService.deleteHistory(historyId);
        return ResponseEntity.ok().build();
    }
    
    /**
     * 히스토리 상세 조회 (historyId)
     */
    @GetMapping("/history/{historyId}")
    public ResponseEntity<DriveHistoryDto> getHistoryById(@PathVariable Long historyId) {
        DriveHistoryDto history = driveModeService.getHistoryById(historyId);
        if (history == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(history);
    }
    
    /**
     * 히스토리 TTS 재생
     */
    @GetMapping("/history/{historyId}/play")
    public ResponseEntity<?> getHistoryTTS(@PathVariable Long historyId) {
        byte[] audioData = driveModeService.getHistoryTTS(historyId);
        
        if (audioData == null || audioData.length == 0) {
            log.error("히스토리 TTS 조회 실패: historyId={}", historyId);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "이 플레이리스트의 오디오 파일을 찾을 수 없습니다.");
            errorResponse.put("code", "TTS_FILE_NOT_FOUND");
            return ResponseEntity.status(404)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .header("Content-Disposition", "inline; filename=history_" + historyId + ".mp3")
                .body(audioData);
    }
    
    /**
     * 플레이리스트 히스토리 업데이트 (재생 완료 시)
     */
    @PatchMapping("/history/{historyId}")
    public ResponseEntity<Void> updatePlaylistHistory(
            @PathVariable Long historyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer currentTime,
            @RequestParam(required = false) Integer listenDuration) {
        
        HistoryStatus historyStatus = null;
        if (status != null && !status.isBlank()) {
            try {
                historyStatus = HistoryStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("잘못된 히스토리 상태: status={}", status);
                return ResponseEntity.badRequest().build();
            }
        }
        driveModeService.updatePlaylistHistory(historyId, historyStatus, currentTime, listenDuration);
        return ResponseEntity.ok().build();
    }

    @GetMapping(value = "/tts/playlist")
    public ResponseEntity<?> generatePlaylistTTS(
            @RequestParam String playlistId,
            @RequestParam Long historyId,
            @RequestParam(required = false, defaultValue = "nova") String voiceType,
            @RequestParam(required = false, defaultValue = "1.0") Float speed) {
        
        try {
            byte[] cached = voiceProcessingService.getHistoryTTS(historyId);
            if (cached != null && cached.length > 0) {
                log.info("플레이리스트 TTS 캐시 사용: historyId={}, 크기={} bytes", historyId, cached.length);
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("audio/mpeg"))
                        .header("Content-Disposition", String.format("inline; filename=playlist_%d.mp3", historyId))
                        .body(cached);
            }
            List<NewsItemDto> newsList = driveModeService.getNewsListForTTS(historyId);
            if (newsList == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "히스토리를 찾을 수 없습니다.");
                errorResponse.put("code", "HISTORY_NOT_FOUND");
                return ResponseEntity.status(404)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }
            byte[] audioData = voiceProcessingService.generatePlaylistTTS(newsList, historyId, voiceType, speed);
            
            if (audioData == null || audioData.length == 0) {
                log.error("플레이리스트 TTS 생성 실패: 빈 오디오 데이터 반환 (historyId={}, voiceType={}, speed={})", 
                        historyId, voiceType, speed);
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "TTS 생성에 실패했습니다. Python 서버 연결을 확인해주세요.");
                errorResponse.put("code", "TTS_GENERATION_FAILED");
                return ResponseEntity.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(errorResponse);
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType("audio/mpeg"))
                    .header("Content-Disposition", String.format("inline; filename=playlist_%d.mp3", historyId))
                    .body(audioData);
        } catch (Exception e) {
            log.error("플레이리스트 TTS 생성 중 오류: {}", e.getMessage(), e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "TTS 생성 중 오류가 발생했습니다: " + e.getMessage());
            errorResponse.put("code", "TTS_ERROR");
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
    }

    /**
     * TTS: 텍스트를 음성으로 변환 (newsId 기반)
     * 이어듣기 지원: startSentenceIdx 파라미터로 문장 단위 재생 시작
     */
    @GetMapping(value = "/tts")
    public ResponseEntity<?> generateTTS(
            @RequestParam String newsId,
            @RequestParam(required = false, defaultValue = "nova") String voiceType,
            @RequestParam(required = false, defaultValue = "1.0") Float speed,
            @RequestParam(required = false, defaultValue = "0") Integer startSentenceIdx) {
        
        String text = driveModeService.getNewsText(newsId, startSentenceIdx);
        byte[] audioData = driveModeService.generateTTS(text, voiceType, speed, newsId);
        
        if (audioData == null || audioData.length == 0) {
            log.error("TTS 생성 실패: 빈 오디오 데이터 반환 (newsId={}, voiceType={}, speed={})", 
                    newsId, voiceType, speed);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "TTS 생성에 실패했습니다. Python 서버 연결을 확인해주세요.");
            errorResponse.put("code", "TTS_GENERATION_FAILED");
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .header("Content-Disposition", "inline; filename=speech.mp3")
                .body(audioData);
    }

    /**
     * TTS: 스크립트를 음성으로 변환
     */
    @GetMapping(value = "/tts/script")
    public ResponseEntity<?> generateTTSScript(
            @RequestParam String text,
            @RequestParam(required = false, defaultValue = "nova") String voiceType,
            @RequestParam(required = false, defaultValue = "1.0") Float speed) {
        
        byte[] audioData = driveModeService.generateTTS(text, voiceType, speed, null);
        
        if (audioData == null || audioData.length == 0) {
            log.error("TTS 생성 실패: 빈 오디오 데이터 반환 (text={}, voiceType={}, speed={})", 
                    text, voiceType, speed);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "TTS 생성에 실패했습니다. Python 서버 연결을 확인해주세요.");
            errorResponse.put("code", "TTS_GENERATION_FAILED");
            return ResponseEntity.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(errorResponse);
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .header("Content-Disposition", "inline; filename=briefing.mp3")
                .body(audioData);
    }
}