package com.fullStc.news.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import com.fullStc.news.domain.NewsCluster;

@Getter
@NoArgsConstructor
public class BriefingResponseDTO {
    private Long id;
    private String title;
    private String summary;
    private String originalUrl;
    private String date;
    private String category;
    private String image; // ★ 이미지가 담길 필드

    // 1. [정석] NewsCluster(요약본) -> DTO 변환
    public BriefingResponseDTO(NewsCluster cluster) {
        this.id = cluster.getId();
        this.title = cluster.getClusterTitle();
        this.summary = cluster.getClusterSummary();
        this.originalUrl = cluster.getRepresentativeUrl();
        this.date = (cluster.getCreatedAt() != null) ? cluster.getCreatedAt().toString() : "";
        this.category = cluster.getCategory();

        // ★ [수정] null 대신 DB에 저장된 URL을 꺼내서 넣습니다!
        // (NewsCluster 엔티티에 getImageUrl() 메소드가 있어야 합니다)
        this.image = cluster.getImageUrl();
    }

    // 2. [비상 대책] 낱개 데이터 -> DTO 변환
    // ★ 파라미터 맨 뒤에 String image를 추가했습니다.
    public BriefingResponseDTO(Long id, String title, String summary, String category, String originalUrl, String date, String image) {
        this.id = id;
        this.title = title;
        this.summary = summary;
        this.category = category;
        this.originalUrl = originalUrl;
        this.date = date;

        // ★ [수정] 받아온 이미지 URL을 넣습니다.
        this.image = image;
    }
}