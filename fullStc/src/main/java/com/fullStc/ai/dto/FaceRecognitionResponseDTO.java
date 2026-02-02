package com.fullStc.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 얼굴 인식 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionResponseDTO {
    
    private boolean success;
    private boolean faceDetected;
    private int faceCount;
    private String description;
    private String matchedUserId;
    private String matchedUserName;
    private Double confidence;
    private String error;
}
