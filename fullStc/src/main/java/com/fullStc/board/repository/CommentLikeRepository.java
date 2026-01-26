package com.fullStc.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.BoardComment;
import com.fullStc.board.domain.CommentLike;
import com.fullStc.member.domain.Member;

import java.util.Optional;

/**
 * 댓글 좋아요 레포지토리
 * 댓글 좋아요 엔티티에 대한 데이터베이스 접근을 제공하는 인터페이스
 */
@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    /**
     * 댓글과 사용자로 좋아요 조회
     * @param comment 댓글
     * @param user 사용자
     * @return 좋아요 Optional
     */
    Optional<CommentLike> findByCommentAndUser(BoardComment comment, Member user);
    
    /**
     * 댓글과 사용자로 좋아요 존재 여부 확인
     * @param comment 댓글
     * @param user 사용자
     * @return 좋아요가 존재하면 true, 아니면 false
     */
    boolean existsByCommentAndUser(BoardComment comment, Member user);
}

