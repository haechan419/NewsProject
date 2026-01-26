package com.fullStc.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.Board;
import com.fullStc.board.domain.BoardView;
import com.fullStc.member.domain.Member;

import java.time.LocalDate;

/**
 * 게시글 조회 기록 레포지토리
 */
@Repository
public interface BoardViewRepository extends JpaRepository<BoardView, Long> {
    
    /**
     * 특정 사용자가 특정 게시글을 특정 날짜에 조회했는지 확인
     */
    boolean existsByBoardAndUserAndViewDate(Board board, Member user, LocalDate viewDate);
}
