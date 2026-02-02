package com.fullStc.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.Board;
import com.fullStc.board.domain.BoardLike;
import com.fullStc.member.domain.Member;

import java.util.Optional;

/**
 * 게시글 좋아요 레포지토리
 * 게시글 좋아요 엔티티에 대한 데이터베이스 접근을 제공하는 인터페이스
 */
@Repository
public interface BoardLikeRepository extends JpaRepository<BoardLike, Long> {
    /**
     * 게시글과 사용자로 좋아요 조회
     * @param board 게시글
     * @param user 사용자
     * @return 좋아요 Optional
     */
    Optional<BoardLike> findByBoardAndUser(Board board, Member user);
    
    /**
     * 게시글과 사용자로 좋아요 존재 여부 확인
     * @param board 게시글
     * @param user 사용자
     * @return 좋아요가 존재하면 true, 아니면 false
     */
    boolean existsByBoardAndUser(Board board, Member user);
}

