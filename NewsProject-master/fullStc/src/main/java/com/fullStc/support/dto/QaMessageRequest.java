package com.fullStc.support.dto;

import lombok.*;

import java.util.List;

/**
 * Q&A 메시지 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaMessageRequest {

    private String message;  // 사용자 질문
    private String sessionId;  // 세션 ID (대화 연속성)
    private List<ConversationMessage> conversationHistory;  // 이전 대화 기록

    /**
     * 대화 메시지 내부 클래스
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationMessage {
        private String role;  // "user" 또는 "assistant"
        private String content;
    }
}
