package com.fullStc.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.Board;
import com.fullStc.board.domain.BoardComment;

import java.util.List;

/**
 * 댓글 레포지토리
 * 댓글 엔티티에 대한 데이터베이스 접근을 제공하는 인터페이스
 */
@Repository
public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {
    /**
     * 게시글의 최상위 댓글 목록 조회 (삭제되지 않은 것만, 생성일 오름차순)
     * @param board 게시글
     * @return 댓글 목록
     */
    List<BoardComment> findByBoardAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(Board board);
}

