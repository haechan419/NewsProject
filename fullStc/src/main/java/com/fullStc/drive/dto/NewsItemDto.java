package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 뉴스 아이템 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsItemDto {
    private String newsId;
    private String clusterKey;  // 클러스터 고유 키 (중복 체크용)
    private String title;
    private String category;
    private String summary;
}
