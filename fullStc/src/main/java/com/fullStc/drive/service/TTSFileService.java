package com.fullStc.drive.service;

import java.util.List;

/**
 * TTS 파일 관리 서비스 인터페이스
 */
public interface TTSFileService {
    
    /**
     * 히스토리 ID로 TTS 파일 삭제
     * @param historyId 히스토리 ID
     */
    void deleteTTSFileByHistoryId(Long historyId);
    
    /**
     * 고아 TTS 파일 정리 (히스토리가 없는 TTS 파일)
     * @return 삭제된 파일 개수
     */
    int cleanupOrphanTTSFiles();
    
    /**
     * 오래된 TTS 파일 정리 (14일 이상 된 히스토리의 TTS 파일)
     * @return 삭제된 파일 개수
     */
    int cleanupOldTTSFiles();
}
