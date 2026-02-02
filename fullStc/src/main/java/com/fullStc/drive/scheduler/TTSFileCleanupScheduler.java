package com.fullStc.drive.scheduler;

import com.fullStc.drive.service.TTSFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * TTS 파일 정리 스케줄러
 * 
 * - 매일 새벽 3시: 고아 파일 정리 (히스토리가 없는 TTS 파일)
 * - 매주 일요일 새벽 4시: 오래된 파일 정리 (14일 이상 된 히스토리의 TTS 파일)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TTSFileCleanupScheduler {
    
    private final TTSFileService ttsFileService;
    
    @Value("${drive.tts.cleanup.enabled:true}")
    private boolean cleanupEnabled;
    
    /**
     * 고아 TTS 파일 정리 (매일 새벽 3시)
     * 히스토리가 없는 TTS 파일 삭제
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupOrphanTTSFiles() {
        if (!cleanupEnabled) {
            log.debug("TTS 파일 정리 스케줄러가 비활성화되어 있습니다.");
            return;
        }
        
        try {
            log.info("고아 TTS 파일 정리 스케줄러 시작");
            int deletedCount = ttsFileService.cleanupOrphanTTSFiles();
            log.info("고아 TTS 파일 정리 스케줄러 완료: 삭제된 파일 개수={}", deletedCount);
        } catch (Exception e) {
            log.error("고아 TTS 파일 정리 스케줄러 실패", e);
        }
    }
    
    /**
     * 오래된 TTS 파일 정리 (매주 일요일 새벽 4시)
     * 14일 이상 된 히스토리의 TTS 파일 삭제
     */
    @Scheduled(cron = "0 0 4 * * 0")
    public void cleanupOldTTSFiles() {
        if (!cleanupEnabled) {
            log.debug("TTS 파일 정리 스케줄러가 비활성화되어 있습니다.");
            return;
        }
        
        try {
            log.info("오래된 TTS 파일 정리 스케줄러 시작");
            int deletedCount = ttsFileService.cleanupOldTTSFiles();
            log.info("오래된 TTS 파일 정리 스케줄러 완료: 삭제된 파일 개수={}", deletedCount);
        } catch (Exception e) {
            log.error("오래된 TTS 파일 정리 스케줄러 실패", e);
        }
    }
}
