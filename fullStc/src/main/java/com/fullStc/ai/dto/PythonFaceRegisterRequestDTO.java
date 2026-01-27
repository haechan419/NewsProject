package com.fullStc.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Python FastAPI로 전송할 얼굴 등록 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PythonFaceRegisterRequestDTO {
    
    /** Base64 인코딩된 이미지 (snake_case로 변환) */
    @JsonProperty("image_base64")
    private String imageBase64;
    
    /** 사용자 ID (snake_case로 변환) */
    @JsonProperty("user_id")
    private String userId;
    
    /** 사용자 이름 (snake_case로 변환) */
    @JsonProperty("user_name")
    private String userName;
}
