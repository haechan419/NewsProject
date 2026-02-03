package com.fullStc.scrap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** 스크랩 항목 DTO (카드 표시용) */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScrapItemDto {
    private Long sno;
    private String newsId;
    private String title;
    private String summary;
    private String imageUrl;
    private String url;
    private String category;
    private LocalDateTime scrapedAt;
}
