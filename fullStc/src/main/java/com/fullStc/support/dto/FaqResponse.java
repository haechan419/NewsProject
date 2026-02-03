package com.fullStc.support.dto;

import com.fullStc.support.domain.Faq;
import com.fullStc.support.domain.FaqCategory;
import lombok.*;

import java.time.LocalDateTime;

/**
 * FAQ 응답 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaqResponse {

    private Long id; 
    private FaqCategory category; // 카테고리
    private String categoryName; // 카테고리 이름
    private String question; // 질문
    private String answer; // 답변
    private String keywords; // 키워드
    private LocalDateTime createdAt; // 생성일시
    private LocalDateTime updatedAt; // 수정일시

    /**
     * Entity -> DTO 변환
     */
    public static FaqResponse from(Faq faq) {
        return FaqResponse.builder()
                .id(faq.getId())
                .category(faq.getCategory())
                .categoryName(faq.getCategory().getDisplayName())
                .question(faq.getQuestion())
                .answer(faq.getAnswer())
                .keywords(faq.getKeywords())
                .createdAt(faq.getCreatedAt())
                .updatedAt(faq.getUpdatedAt())
                .build();
    }
}
