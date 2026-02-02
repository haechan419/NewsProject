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
    private FaqCategory category;
    private String categoryName;
    private String question;
    private String answer;
    private String keywords;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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
                .viewCount(faq.getViewCount())
                .createdAt(faq.getCreatedAt())
                .updatedAt(faq.getUpdatedAt())
                .build();
    }
}
