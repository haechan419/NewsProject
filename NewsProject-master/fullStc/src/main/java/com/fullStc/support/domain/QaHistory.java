package com.fullStc.support.domain;

import com.fullStc.member.domain.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Q&A 대화 히스토리 엔티티
 * 사용자의 질문과 AI 응답을 저장
 */
@Entity
@Table(name = "qa_history", indexes = {
    @Index(name = "idx_qa_user_id", columnList = "user_id"),
    @Index(name = "idx_qa_session_id", columnList = "session_id")
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QaHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(name = "user_question", nullable = false, columnDefinition = "TEXT")
    private String userQuestion;

    @Column(name = "ai_answer", nullable = false, columnDefinition = "TEXT")
    private String aiAnswer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faq_id")
    private Faq relatedFaq;  // 관련 FAQ (nullable)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
