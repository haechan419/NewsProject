package com.fullStc.ai.service;

import com.fullStc.ai.dto.FaceRegisterRequestDTO;
import com.fullStc.ai.dto.FaceRegisterResponseDTO;
import com.fullStc.ai.dto.FaceRecognitionRequestDTO;
import com.fullStc.ai.dto.FaceRecognitionResponseDTO;

/**
 * AI 얼굴 인식 서비스 인터페이스
 */
public interface AiFaceService {
    
    /**
     * 얼굴 등록
     * 
     * @param requestDTO 얼굴 등록 요청 DTO
     * @return 얼굴 등록 응답 DTO
     */
    FaceRegisterResponseDTO registerFace(FaceRegisterRequestDTO requestDTO);
    
    /**
     * 얼굴 인식
     * 
     * @param requestDTO 얼굴 인식 요청 DTO
     * @return 얼굴 인식 응답 DTO
     */
    FaceRecognitionResponseDTO recognizeFace(FaceRecognitionRequestDTO requestDTO);
}
