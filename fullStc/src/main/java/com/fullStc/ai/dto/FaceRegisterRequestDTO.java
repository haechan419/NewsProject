package com.fullStc.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 얼굴 등록 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRegisterRequestDTO {
    
    /** Base64 인코딩된 이미지 */
    private String imageBase64;
    
    /** 사용자 ID (필수) */
    private String userId;
    
    /** 사용자 이름 (선택) */
    private String userName;
}
