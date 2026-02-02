package com.fullStc.member.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

// 비밀번호 재설정 토큰을 저장하는 도메인
@Entity
@Table(name = "password_reset_tokens")
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@EntityListeners(AuditingEntityListener.class) // JPA Auditing을 위한 리스너 (생성일 자동 관리)
public class PasswordResetToken {
    // 비밀번호 재설정 토큰 고유 ID (PK)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 토큰을 소유한 회원 (N:1 관계)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 비밀번호 재설정 토큰 값 (유니크)
    @Column(nullable = false, unique = true, length = 500)
    private String token;

    // 토큰 만료일시 (1시간 후)
    @Column(nullable = false)
    private LocalDateTime expiryDate;

    // 토큰 사용 여부 (true: 사용됨, false: 미사용)
    @Column(nullable = false)
    @Builder.Default
    private boolean used = false;

    // 토큰 생성일시 (자동 생성)
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // 토큰 만료 여부 확인
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }

    // 토큰 사용 처리
    public void markAsUsed() {
        this.used = true;
    }
}
