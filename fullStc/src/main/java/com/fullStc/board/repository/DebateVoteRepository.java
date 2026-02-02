package com.fullStc.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.Board;
import com.fullStc.board.domain.DebateVote;
import com.fullStc.member.domain.Member;

import java.util.Optional;

/**
 * 토론 투표 레포지토리
 * 토론 게시판 투표 엔티티에 대한 데이터베이스 접근을 제공하는 인터페이스
 */
@Repository
public interface DebateVoteRepository extends JpaRepository<DebateVote, Long> {
    /**
     * 게시글과 사용자로 투표 조회
     * @param board 게시글
     * @param user 사용자
     * @return 투표 Optional
     */
    Optional<DebateVote> findByBoardAndUser(Board board, Member user);
}

