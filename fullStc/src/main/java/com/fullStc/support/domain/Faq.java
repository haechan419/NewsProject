package com.fullStc.support.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * FAQ 엔티티
 * 자주 묻는 질문과 답변을 저장
 */
@Entity
@Table(name = "faq")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Faq {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private FaqCategory category;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(columnDefinition = "TEXT")
    private String keywords;  // 검색 키워드 (쉼표 구분)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * FAQ 수정
     */
    public void update(FaqCategory category, String question, String answer, String keywords) {
        this.category = category;
        this.question = question;
        this.answer = answer;
        this.keywords = keywords;
    }
}
