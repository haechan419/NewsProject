package com.fullStc.support.dto;

import com.fullStc.support.domain.QaHistory;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Q&A 히스토리 응답 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaHistoryResponse {

    private Long id;
    private String sessionId;
    private String userQuestion;
    private String aiAnswer;
    private Long relatedFaqId;
    private LocalDateTime createdAt;

    /**
     * Entity -> DTO 변환
     */
    public static QaHistoryResponse from(QaHistory history) {
        return QaHistoryResponse.builder()
                .id(history.getId())
                .sessionId(history.getSessionId())
                .userQuestion(history.getUserQuestion())
                .aiAnswer(history.getAiAnswer())
                .relatedFaqId(history.getRelatedFaq() != null ? history.getRelatedFaq().getId() : null)
                .createdAt(history.getCreatedAt())
                .build();
    }
}
