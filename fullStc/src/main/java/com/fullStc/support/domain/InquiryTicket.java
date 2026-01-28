package com.fullStc.support.domain;

import com.fullStc.member.domain.Member;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 문의 티켓 엔티티
 * 고객의 직접 문의를 저장
 */
@Entity
@Table(name = "inquiry_ticket")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InquiryTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    @Enumerated(EnumType.STRING)
    private FaqCategory category;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InquiryStatus status = InquiryStatus.PENDING;

    @Column(name = "ai_response", columnDefinition = "TEXT")
    private String aiResponse;  // AI 자동 응답

    @Column(name = "admin_response", columnDefinition = "TEXT")
    private String adminResponse;  // 관리자 답변

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 상태 변경
     */
    public void changeStatus(InquiryStatus status) {
        this.status = status;
    }

    /**
     * AI 응답 설정
     */
    public void setAiResponse(String aiResponse) {
        this.aiResponse = aiResponse;
    }

    /**
     * 관리자 답변 설정
     */
    public void setAdminResponse(String adminResponse) {
        this.adminResponse = adminResponse;
        this.status = InquiryStatus.COMPLETED;
    }
}
