package com.fullStc.briefdelivery.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * 브리핑 배송 1회 예약 엔티티
 */
@Entity
@Table(name = "brief_delivery_schedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BriefDeliverySchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** 실제 발송 프로세스(=PDF 생성+메일 발송) 시작 시각 */
    @Column(name = "last_attempt_at")
    private Instant lastAttemptAt;

    /** 발송 완료 시각 */
    @Column(name = "completed_at")
    private Instant completedAt;

    /** 실패 시 에러 메시지(디버깅/브라우저 확인용) */
    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
