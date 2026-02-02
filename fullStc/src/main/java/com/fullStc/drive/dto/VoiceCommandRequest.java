package com.fullStc.drive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceCommandRequest {
    @NotBlank(message = "텍스트는 필수입니다")
    private String rawText; // STT 변환 원문
    
    @NotNull(message = "사용자 ID는 필수입니다")
    private Long userId;
}
