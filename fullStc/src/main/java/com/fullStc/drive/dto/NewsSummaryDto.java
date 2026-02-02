package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsSummaryDto {
    private String newsId;
    private String category;
    private String summaryText;
    private Boolean isHot;
    private String title; // Mock용
}

