package com.fullStc.board.domain;

import com.fullStc.member.domain.Member;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 토론 게시판 투표 엔티티
 * 토론 게시판에서 사용자가 찬성/반대 투표를 한 정보를 담는 엔티티
 * 한 사용자는 한 게시글에 하나의 투표만 가능 (unique constraint)
 */
@Entity
@Table(name = "debate_vote", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"board_id", "user_id"})
})
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebateVote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 투표 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board; // 게시글

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user; // 투표한 사용자

    @Column(name = "vote_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private VoteType voteType; // 투표 타입 (AGREE: 찬성, DISAGREE: 반대)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 투표 타입 열거형
     */
    public enum VoteType {
        AGREE,    // 찬성
        DISAGREE  // 반대
    }
}

