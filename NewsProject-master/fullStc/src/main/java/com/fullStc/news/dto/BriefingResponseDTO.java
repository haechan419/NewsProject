package com.fullStc.news.dto;

import lombok.Getter;
import lombok.NoArgsConstructor; // 기본 생성자
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
    private String image; // ★ [추가] 이미지 필드 (없으면 null)

    // 1. [정석] NewsCluster(요약본)를 받아서 DTO로 변환하는 생성자
    public BriefingResponseDTO(NewsCluster cluster) {
        this.id = cluster.getId();
        this.title = cluster.getClusterTitle();
        this.summary = cluster.getClusterSummary();
        this.originalUrl = cluster.getRepresentativeUrl();
        this.date = (cluster.getCreatedAt() != null) ? cluster.getCreatedAt().toString() : "";
        this.category = cluster.getCategory();
        this.image = null; // 클러스터에는 이미지가 없으면 null 처리
    }

    // 2. [비상 대책] 원본 뉴스(News) 데이터를 낱개로 받아서 DTO로 변환하는 생성자
    // ★ Controller에서 new BriefingResponseDTO(...) 할 때 이 생성자가 호출됩니다!
    public BriefingResponseDTO(Long id, String title, String summary, String category, String originalUrl, String date) {
        this.id = id;
        this.title = title;
        this.summary = summary;
        this.category = category;
        this.originalUrl = originalUrl;
        this.date = date;
        this.image = null; // 원본 뉴스에 이미지가 있다면 여기에 넣으면 됩니다.
    }
}