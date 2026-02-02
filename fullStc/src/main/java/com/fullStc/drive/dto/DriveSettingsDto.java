package com.fullStc.drive.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriveSettingsDto {
    
    // Float 타입은 서비스 레이어에서 검증 (0.5 ~ 2.0)
    private Float voiceSpeed;
    
    @Pattern(regexp = "^(alloy|echo|fable|onyx|nova|shimmer|ash|sage|coral|DEFAULT)$", 
             message = "유효하지 않은 음성 타입입니다")
    private String voiceType;
    
    private Boolean autoPlay;
    
    @Min(value = 0, message = "볼륨은 0 이상이어야 합니다")
    @Max(value = 100, message = "볼륨은 100 이하여야 합니다")
    private Integer volLevel;
    
    @Pattern(regexp = "^(SUGGEST|AUTO)$", message = "시작 모드는 SUGGEST 또는 AUTO여야 합니다")
    private String startMode;
    
    private Boolean recEnabled;
}

