package com.fullStc.mainpage.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * 메인페이지용 뉴스 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MainPageNewsDTO {
    private Long id;
    private Long newsId;
    private String title;
    private String summary;
    private String category;
    private String url;
    private String sourceName;
    private Instant publishedAt;
    private Long viewCount;
}
