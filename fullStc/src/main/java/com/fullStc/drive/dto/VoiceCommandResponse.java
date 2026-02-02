package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 텍스트 기반 통합 응답 DTO
 * 
 * Intent 분석 + DJ 스크립트 + TTS 오디오 URL을 한 번에 반환
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceCommandResponse {
    /**
     * 명령 의도 (NEXT, PAUSE, RESUME, SAVE, STOP 등)
     */
    private String intent;
    
    /**
     * 신뢰도 점수 (0.0 ~ 1.0)
     */
    private Float confidence;
    
    /**
     * DJ 스타일 브리핑 스크립트 (뉴스 재생 시)
     */
    private String djScript;
    
    /**
     * TTS 오디오 URL 또는 base64 인코딩된 오디오 데이터
     */
    private String audioUrl;
    
    /**
     * Java 로컬에서 처리했는지 여부
     */
    private Boolean processedLocally;
    
    /**
     * 처리 결과 메시지
     */
    private String message;
}

