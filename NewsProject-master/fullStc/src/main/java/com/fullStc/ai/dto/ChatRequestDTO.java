package com.fullStc.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * AI 채팅 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequestDTO {
    
    /** 사용자 메시지 */
    private String message;
    
    /** 이전 대화 기록 */
    private List<ConversationMessage> conversationHistory;
    
    /**
     * 대화 메시지 내부 클래스
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationMessage {
        /** 역할: "user" 또는 "assistant" */
        private String role;
        
        /** 메시지 내용 */
        private String content;
    }
}
