package com.fullStc.news.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "news_cluster",
        uniqueConstraints = @UniqueConstraint(name = "uk_cluster_key", columnNames = {"cluster_key"}),
        indexes = {
                @Index(name = "idx_category", columnList = "category"),
                @Index(name = "idx_updated", columnList = "updated_at")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class NewsCluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String representativeUrl; // ★ [NEW] 가장 신뢰도 높은 기사 링크

    @Column(name="category", length = 32)
    private String category;

    @Column(name="cluster_key", nullable=false, length = 64)
    private String clusterKey;

    @Column(name="representative_news_id")
    private Long representativeNewsId;

    @Column(name="cluster_title", length = 512)
    private String clusterTitle;

    @Lob
    @Column(name="cluster_summary",columnDefinition = "TEXT")
    private String clusterSummary;

    @Column(name="quality_score")
    private Integer qualityScore;

    @Lob
    @Column(name="risk_flags", columnDefinition = "JSON")
    private String riskFlags;

    @Column(name="badge", length = 8)
    private String badge;

    @Column(name="created_at")
    private Instant createdAt;

    @Column(name="updated_at")
    private Instant updatedAt;

    // created_at/updated_at 자동 채우기 (DB default가 있어도 JPA에서 쓰면 편함)
    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    // ★ [추가] 여기가 명당입니다.
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    // (Getter/Setter 필요하면 추가, @Data 쓰시면 생략 가능)
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getImageUrl() { return this.imageUrl; }
    
    @JsonIgnore  // 👈 이거 필수! (안 붙이면 프론트가 다운됨)
    @OneToMany(mappedBy = "newsCluster")
    private List<News> newsList = new ArrayList<>();

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}

