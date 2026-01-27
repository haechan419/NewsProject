package com.fullStc.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 얼굴 등록 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRegisterResponseDTO {
    
    private boolean success;
    private String message;
    private boolean faceDetected;
    private String faceDescription;
    private String error;
}
