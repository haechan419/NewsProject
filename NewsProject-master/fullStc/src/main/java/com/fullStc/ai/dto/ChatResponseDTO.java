package com.fullStc.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * AI 채팅 응답 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponseDTO {
    
    /** AI 응답 메시지 */
    private String reply;
    
    /** 응답 시각 */
    private LocalDateTime timestamp;
}
