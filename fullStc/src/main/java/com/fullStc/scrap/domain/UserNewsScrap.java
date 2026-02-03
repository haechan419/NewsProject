package com.fullStc.scrap.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/** 뉴스 스크랩 엔티티. 테이블: tbl_user_news_scrap */
@Entity
@Table(name = "tbl_user_news_scrap", indexes = @Index(name = "idx_user_news_scrap_member", columnList = "memberId"))
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class UserNewsScrap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(length = 64, nullable = false)
    private String newsId;

    @Column(length = 512)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String url;

    @Column(length = 32)
    private String category;

    @CreatedDate
    @Column(name = "regdate", updatable = false)
    private LocalDateTime regDate;
}
