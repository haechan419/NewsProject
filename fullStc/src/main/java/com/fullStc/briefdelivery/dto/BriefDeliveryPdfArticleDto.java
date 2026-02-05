package com.fullStc.briefdelivery.dto;

import lombok.*;

/**
 * PDF용 기사 한 건 (Python 전달)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BriefDeliveryPdfArticleDto {

    private Long id;
    private String title;
    private String summary;
    private String originalUrl;
    private String category;
    private String image;
    private String date;
}
