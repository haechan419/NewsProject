package com.fullStc.briefdelivery.dto;

import lombok.*;

import java.util.List;

/**
 * Python PDF 생성 API 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BriefDeliveryPdfRequestDto {

    private String userName;
    private String userEmail;
    private String publishDate;
    private String scheduledTimeLog;
    /** 리드 기사 1건 */
    private BriefDeliveryPdfArticleDto leadArticle;
    /** 카테고리별 기사 (그리드용, 카테고리 순서 유지) */
    private List<BriefDeliveryPdfArticleDto> gridArticles;
}
