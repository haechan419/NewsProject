package com.fullStc.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Python FastAPI로 전송할 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PythonChatRequestDTO {
    
    /** 사용자 메시지 */
    private String message;
    
    /** 이전 대화 기록 (snake_case로 변환) */
    @JsonProperty("conversation_history")
    private List<ConversationMessage> conversationHistory;
    
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationMessage {
        private String role;
        private String content;
    }
}
