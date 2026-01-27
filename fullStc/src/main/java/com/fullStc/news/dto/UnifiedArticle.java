package com.fullStc.news.dto;

import lombok.*;

import java.time.Instant;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UnifiedArticle {
    private String id;
    private String title;
    private String summary;
    private String url;
    private String imageUrl;
    private Instant publishedAt;
    private String sourceName;
    private String provider;
    private String category;
}
