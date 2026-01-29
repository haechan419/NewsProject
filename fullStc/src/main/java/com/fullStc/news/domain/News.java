package com.fullStc.news.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
        name = "news",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_source",
                columnNames = {"provider", "source_id"}
        ),
        indexes = {
                @Index(name = "idx_published", columnList = "published_at"),
                @Index(name = "idx_provider", columnList = "provider"),
                @Index(name = "idx_cluster", columnList = "dup_cluster_id"),
                @Index(name = "idx_verified", columnList = "verified_at")
        }
)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class News {

    /* ===================== 기본 식별 ===================== */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_id", nullable = false, length = 64)
    private String sourceId;

    @Column(name = "provider", nullable = false, length = 32)
    private String provider;

    /* ===================== 메타 정보 ===================== */

    @Column(name = "title", length = 512)
    private String title;

    @Column(name = "source_name", length = 128)
    private String sourceName;

    @Column(name = "category", length = 32)
    private String category;

    /**
     * url은 길어질 수 있어서 LONGTEXT로 확정
     */
    @Column(name = "url", columnDefinition = "LONGTEXT")
    private String url;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "fetched_at")
    private Instant fetchedAt;

    /* ===================== 본문 / 요약 ===================== */

    /**
     * 스니펫/AI요약/통합요약 등 저장용 (롱텍스트 확정)
     */
    @Column(name = "summary", columnDefinition = "LONGTEXT")
    private String summary;

    /**
     * 원문 전체 (크롤링 결과) - 롱텍스트 확정
     */
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "content_extracted_at")
    private Instant contentExtractedAt;

    /**
     * AI가 생성한 요약 (snippet 아님) - 롱텍스트 확정
     */
    @Column(name = "ai_summary", columnDefinition = "LONGTEXT")
    private String aiSummary;

    @Column(name = "ai_summarized_at")
    private Instant aiSummarizedAt;

    /* ===================== 임베딩 ===================== */

    /**
     * MySQL JSON 타입 컬럼
     * - Java에서는 String(JSON array string)으로 유지
     * - @Lob 붙이면 dialect에 따라 이상 매핑/검증 충돌 가능 → 붙이지 않음
     */
    @Column(name = "embedding", columnDefinition = "JSON")
    private String embedding;

    @Column(name = "embedding_at")
    private Instant embeddingAt;

    /* ===================== AI#5 품질/신뢰도 결과 ===================== */

    /**
     * 중복/토픽 클러스터 ID (news_cluster.id)
     */
    @Column(name = "dup_cluster_id")
    private Long dupClusterId;

    /**
     * 0~100
     */
    @Column(name = "quality_score")
    private Integer qualityScore;

    /**
     * MySQL JSON 타입 컬럼
     * - 예: ["NO_EVIDENCE","LOW_CROSS_SOURCE",...]
     */
    @Column(name = "risk_flags", columnDefinition = "JSON")
    private String riskFlags;

    /**
     * ✅ / ⚠️ / ❌
     */
    @Column(name = "badge", length = 8)
    private String badge;

    /**
     * 품질검사 완료 시각
     */
    @Column(name = "verified_at")
    private Instant verifiedAt;

    @ManyToOne(fetch = FetchType.LAZY) // 부모는 필요할 때만 가져온다 (성능 최적화)
    @JoinColumn(name = "cluster_id")   // DB 테이블의 실제 컬럼명 (news 테이블의 cluster_id 컬럼)
    private NewsCluster newsCluster;   // ★ 이 변수 이름이 'mappedBy'와 똑같아야 함!
}

