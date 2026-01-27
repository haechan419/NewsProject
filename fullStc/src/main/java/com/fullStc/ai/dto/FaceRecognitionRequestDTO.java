package com.fullStc.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 얼굴 인식 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionRequestDTO {
    
    /** Base64 인코딩된 이미지 */
    private String imageBase64;
    
    /** 사용자 ID (선택, 특정 사용자와 비교할 때 사용) */
    private String userId;
}
