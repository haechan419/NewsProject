package com.fullStc.drive.service;

import com.fullStc.drive.entity.DriveHistory;
import com.fullStc.drive.repository.DriveHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TTSFileServiceImpl implements TTSFileService {
    
    private final DriveHistoryRepository driveHistoryRepository;
    private final VoiceProcessingService voiceProcessingService;
    
    @Override
    @Transactional
    public void deleteTTSFileByHistoryId(Long historyId) {
        try {
            log.info("TTS 파일 삭제 요청: historyId={}", historyId);
            voiceProcessingService.deleteTTSFile(historyId);
            log.info("TTS 파일 삭제 완료: historyId={}", historyId);
        } catch (Exception e) {
            log.error("TTS 파일 삭제 실패: historyId={}, error={}", historyId, e.getMessage(), e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public int cleanupOrphanTTSFiles() {
        try {
            log.info("고아 TTS 파일 정리 시작");
            int deletedCount = voiceProcessingService.cleanupOrphanTTSFiles();
            log.info("고아 TTS 파일 정리 완료: 삭제된 파일 개수={}", deletedCount);
            return deletedCount;
        } catch (Exception e) {
            log.error("고아 TTS 파일 정리 실패: error={}", e.getMessage(), e);
            return 0;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public int cleanupOldTTSFiles() {
        try {
            log.info("오래된 TTS 파일 정리 시작");
            
            // 14일 이전 히스토리 조회
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(14);
            List<DriveHistory> oldHistories = driveHistoryRepository.findByCreatedAtBefore(cutoffDate);
            
            log.info("14일 이상 된 히스토리 개수: {}", oldHistories.size());
            
            int deletedCount = 0;
            for (DriveHistory history : oldHistories) {
                try {
                    voiceProcessingService.deleteTTSFile(history.getHistoryId());
                    deletedCount++;
                } catch (Exception e) {
                    log.warn("TTS 파일 삭제 실패: historyId={}, error={}", history.getHistoryId(), e.getMessage());
                }
            }
            
            log.info("오래된 TTS 파일 정리 완료: 삭제된 파일 개수={}", deletedCount);
            return deletedCount;
        } catch (Exception e) {
            log.error("오래된 TTS 파일 정리 실패: error={}", e.getMessage(), e);
            return 0;
        }
    }
}
