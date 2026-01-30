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

    // ★ [NEW] 카테고리 필드 추가 (economy, politics, it 등)
    private String category;

    public BriefingResponseDTO(NewsCluster cluster) {
        this.id = cluster.getId();

        // 엔티티의 clusterTitle -> DTO의 title
        this.title = cluster.getClusterTitle();

        // 엔티티의 clusterSummary -> DTO의 summary ([서론][본론][결론] 포함된 텍스트)
        this.summary = cluster.getClusterSummary();

        // 대표 기사 URL
        this.originalUrl = cluster.getRepresentativeUrl();

        // 날짜 (없으면 빈 문자열)
        this.date = (cluster.getCreatedAt() != null) ? cluster.getCreatedAt().toString() : "";

        // ★ [NEW] 카테고리 정보 매핑
        this.category = cluster.getCategory();
    }

}