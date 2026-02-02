package com.fullStc.support.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Q&A 메시지 응답 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaMessageResponse {

    private String reply;  // AI 응답
    private String sessionId;  // 세션 ID
    private LocalDateTime timestamp;
    private List<FaqResponse> relatedFaqs;  // 관련 FAQ 목록 (참고용)
}
