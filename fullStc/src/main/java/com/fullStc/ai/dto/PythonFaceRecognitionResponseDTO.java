package com.fullStc.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Python FastAPI로부터 받는 얼굴 인식 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PythonFaceRecognitionResponseDTO {
    
    private boolean success;
    
    @JsonProperty("face_detected")
    private boolean faceDetected;
    
    @JsonProperty("face_count")
    private int faceCount;
    
    private String description;
    
    @JsonProperty("matched_user_id")
    private String matchedUserId;
    
    @JsonProperty("matched_user_name")
    private String matchedUserName;
    
    private Double confidence;
    private String error;
}
