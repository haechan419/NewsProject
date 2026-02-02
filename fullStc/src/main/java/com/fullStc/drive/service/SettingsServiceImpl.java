package com.fullStc.drive.service;

import com.fullStc.drive.dto.DriveSettingsDto;
import com.fullStc.drive.entity.DriveSettings;
import com.fullStc.drive.repository.DriveSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {
    
    private final DriveSettingsRepository driveSettingsRepository;
    private final ModelMapper modelMapper;
    
    @Override
    public DriveSettingsDto getSettings(Long userId) {
        DriveSettings settings = driveSettingsRepository.findById(userId)
                .orElseGet(() -> {
                    // 기본 설정 생성
                    DriveSettings defaultSettings = DriveSettings.builder()
                            .userId(userId)
                            .build();
                    return driveSettingsRepository.save(defaultSettings);
                });
        
        // Entity -> DTO 변환 (ModelMapper 사용)
        return modelMapper.map(settings, DriveSettingsDto.class);
    }
    
    @Override
    @Transactional
    public DriveSettingsDto updateSettings(Long userId, DriveSettingsDto dto) {
        Optional<DriveSettings> existingOpt = driveSettingsRepository.findById(userId);
        
        DriveSettings settings;
        if (existingOpt.isPresent()) {
            settings = existingOpt.get();
            // DTO의 값으로 Entity 업데이트 (null이 아닌 값만, 검증 포함)
            if (dto.getVoiceSpeed() != null) {
                // 범위 검증: 0.5 ~ 2.0
                float speed = Math.max(0.5f, Math.min(2.0f, dto.getVoiceSpeed()));
                settings.setVoiceSpeed(speed);
            }
            if (dto.getVoiceType() != null) {
                // "DEFAULT"를 "nova"로 변환
                String voiceType = "DEFAULT".equalsIgnoreCase(dto.getVoiceType()) 
                    ? "nova" 
                    : dto.getVoiceType();
                settings.setVoiceType(voiceType);
            }
            if (dto.getAutoPlay() != null) {
                settings.setAutoPlay(dto.getAutoPlay());
            }
            if (dto.getVolLevel() != null) {
                // 범위 검증: 0 ~ 100
                int volLevel = Math.max(0, Math.min(100, dto.getVolLevel()));
                settings.setVolLevel(volLevel);
            }
            if (dto.getStartMode() != null) {
                // 유효성 검증: SUGGEST 또는 AUTO만 허용
                String startMode = dto.getStartMode();
                if ("SUGGEST".equals(startMode) || "AUTO".equals(startMode)) {
                    settings.setStartMode(startMode);
                } else {
                    log.warn("유효하지 않은 startMode: {}, 기본값 SUGGEST 사용", startMode);
                    settings.setStartMode("SUGGEST");
                }
            }
            if (dto.getRecEnabled() != null) {
                settings.setRecEnabled(dto.getRecEnabled());
            }
        } else {
            // 새로 생성 (DTO -> Entity 변환)
            settings = modelMapper.map(dto, DriveSettings.class);
            settings.setUserId(userId);
            
            // 기본값 검증
            if (settings.getVoiceSpeed() == null || settings.getVoiceSpeed() < 0.5f || settings.getVoiceSpeed() > 2.0f) {
                settings.setVoiceSpeed(1.0f);
            }
            if (settings.getVolLevel() == null || settings.getVolLevel() < 0 || settings.getVolLevel() > 100) {
                settings.setVolLevel(80);
            }
            if (settings.getStartMode() == null || 
                (!"SUGGEST".equals(settings.getStartMode()) && !"AUTO".equals(settings.getStartMode()))) {
                settings.setStartMode("SUGGEST");
            }
        }
        
        DriveSettings saved = driveSettingsRepository.save(settings);
        
        // Entity -> DTO 변환 (ModelMapper 사용)
        return modelMapper.map(saved, DriveSettingsDto.class);
    }
}
