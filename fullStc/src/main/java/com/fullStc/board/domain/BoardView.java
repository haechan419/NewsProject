package com.fullStc.board.domain;

import com.fullStc.member.domain.Member;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 게시글 조회 기록 엔티티
 * 사용자별 1일 1회 조회수 증가를 위한 기록 저장
 */
@Entity
@Table(name = "board_view", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"board_id", "user_id", "view_date"})
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardView {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    @Column(name = "view_date", nullable = false)
    private LocalDate viewDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
