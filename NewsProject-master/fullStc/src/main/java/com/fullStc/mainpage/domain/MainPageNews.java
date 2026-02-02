package com.fullStc.mainpage.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * 메인페이지용 뉴스 도메인
 * News 엔티티를 참조하여 메인페이지에 필요한 정보만 포함
 */
@Entity
@Table(name = "main_page_news")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MainPageNews {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * News 엔티티의 ID 참조
     */
    @Column(name = "news_id", nullable = false, unique = true)
    private Long newsId;

    /**
     * 뉴스 제목
     */
    @Column(name = "title", length = 512, nullable = false)
    private String title;

    /**
     * 뉴스 요약
     */
    @Column(name = "summary", columnDefinition = "LONGTEXT")
    private String summary;

    /**
     * 카테고리
     */
    @Column(name = "category", length = 32)
    private String category;

    /**
     * 뉴스 URL
     */
    @Column(name = "url", columnDefinition = "LONGTEXT")
    private String url;

    /**
     * 출처명
     */
    @Column(name = "source_name", length = 128)
    private String sourceName;

    /**
     * 발행일시
     */
    @Column(name = "published_at")
    private Instant publishedAt;

    /**
     * 조회수 (인기 뉴스 정렬용)
     */
    @Column(name = "view_count")
    @Builder.Default
    private Long viewCount = 0L;

    /**
     * 생성일시
     */
    @Column(name = "created_at")
    private Instant createdAt;

    /**
     * 수정일시
     */
    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
