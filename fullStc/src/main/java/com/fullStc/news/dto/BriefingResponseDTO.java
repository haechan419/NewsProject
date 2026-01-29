package com.fullStc.news.dto; // 패키지명 확인

import lombok.Getter;
import com.fullStc.news.domain.NewsCluster;

@Getter
public class BriefingResponseDTO {
    private Long id;
    private String title;
    private String summary;
    private String originalUrl;
    private String date;

    public BriefingResponseDTO(NewsCluster cluster) {
        this.id = cluster.getId();

        // ★ 수정된 부분 1: 엔티티 필드명이 clusterTitle 입니다.
        this.title = cluster.getClusterTitle();

        // ★ 수정된 부분 2: 엔티티 필드명이 clusterSummary 입니다. (summary -> getClusterSummary)
        this.summary = cluster.getClusterSummary();

        this.originalUrl = cluster.getRepresentativeUrl();

        // 날짜 변환 (Null 방지 처리 살짝 추가하면 더 안전합니다)
        this.date = (cluster.getCreatedAt() != null) ? cluster.getCreatedAt().toString() : "";
    }
}