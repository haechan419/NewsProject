package com.fullStc.drive.service;

import com.fullStc.drive.dto.DriveSettingsDto;

/**
 * 설정 관련 서비스 인터페이스
 */
public interface SettingsService {
    
    /**
     * 사용자 설정 조회
     */
    DriveSettingsDto getSettings(Long userId);
    
    /**
     * 사용자 설정 업데이트
     */
    DriveSettingsDto updateSettings(Long userId, DriveSettingsDto dto);
}
