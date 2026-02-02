package com.fullStc.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Python FastAPI로부터 받는 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PythonChatResponseDTO {
    
    /** AI 응답 메시지 */
    private String reply;
}
