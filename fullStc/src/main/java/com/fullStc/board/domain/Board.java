package com.fullStc.board.domain;

import com.fullStc.member.domain.Member;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 게시판 엔티티
 * 일반 게시판과 토론 게시판을 모두 지원하는 게시글 정보를 담는 엔티티
 */
@Entity
@Table(name = "board")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Board {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 게시글 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user; // 작성자

    @Column(name = "board_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private BoardType boardType; // 게시판 타입 (NORMAL: 일반, DEBATE: 토론)

    @Column(nullable = false, length = 255)
    private String title; // 제목

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // 내용

    @Column(name = "debate_topic", length = 255)
    private String debateTopic; // 토론 주제 (토론 게시판일 경우 사용)

    @Column(name = "agree_count")
    @Builder.Default
    private Integer agreeCount = 0; // 찬성 수 (토론 게시판)

    @Column(name = "disagree_count")
    @Builder.Default
    private Integer disagreeCount = 0; // 반대 수 (토론 게시판)

    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0; // 조회수

    @Column(name = "comment_count")
    @Builder.Default
    private Integer commentCount = 0; // 댓글 수

    @Column(name = "like_count")
    @Builder.Default
    private Integer likeCount = 0; // 좋아요 수

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false; // 삭제 여부 (soft delete)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // 작성일

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정일

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BoardFile> files = new ArrayList<>(); // 첨부 파일 목록

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BoardLike> likes = new ArrayList<>(); // 좋아요 목록

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DebateVote> votes = new ArrayList<>(); // 투표 목록 (토론 게시판)

    @OneToMany(mappedBy = "board", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BoardComment> comments = new ArrayList<>(); // 댓글 목록

    /**
     * 게시글 수정
     */
    public void update(String title, String content) {
        this.title = title;
        this.content = content;
    }

    /**
     * 게시글 삭제 (soft delete)
     */
    public void delete() {
        this.isDeleted = true;
    }

    /**
     * 조회수 증가
     */
    public void increaseViewCount() {
        this.viewCount++;
    }

    /**
     * 댓글 수 증가
     */
    public void increaseCommentCount() {
        this.commentCount++;
    }

    /**
     * 댓글 수 감소
     */
    public void decreaseCommentCount() {
        this.commentCount = Math.max(0, this.commentCount - 1);
    }

    /**
     * 좋아요 수 증가
     */
    public void increaseLikeCount() {
        this.likeCount++;
    }

    /**
     * 좋아요 수 감소
     */
    public void decreaseLikeCount() {
        this.likeCount = Math.max(0, this.likeCount - 1);
    }

    /**
     * 찬성 수 증가
     */
    public void increaseAgreeCount() {
        this.agreeCount++;
    }

    /**
     * 찬성 수 감소
     */
    public void decreaseAgreeCount() {
        this.agreeCount = Math.max(0, this.agreeCount - 1);
    }

    /**
     * 반대 수 증가
     */
    public void increaseDisagreeCount() {
        this.disagreeCount++;
    }

    /**
     * 반대 수 감소
     */
    public void decreaseDisagreeCount() {
        this.disagreeCount = Math.max(0, this.disagreeCount - 1);
    }

    /**
     * 게시판 타입 열거형
     */
    public enum BoardType {
        NORMAL, // 일반 게시판
        DEBATE  // 토론 게시판
    }
}

