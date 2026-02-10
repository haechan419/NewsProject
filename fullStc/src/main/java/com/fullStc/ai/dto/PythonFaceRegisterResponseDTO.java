package com.fullStc.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Python FastAPI로부터 받는 얼굴 등록 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PythonFaceRegisterResponseDTO {

    private boolean success;
    private String message;

    @JsonProperty("face_detected")
    private boolean faceDetected;

    @JsonProperty("face_description")
    private String faceDescription;

    private String error;
}
