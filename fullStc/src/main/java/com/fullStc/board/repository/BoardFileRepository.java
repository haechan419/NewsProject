package com.fullStc.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.Board;
import com.fullStc.board.domain.BoardFile;

import java.util.List;

/**
 * 게시글 파일 레포지토리
 * 게시글 첨부 파일 엔티티에 대한 데이터베이스 접근을 제공하는 인터페이스
 */
@Repository
public interface BoardFileRepository extends JpaRepository<BoardFile, Long> {
    /**
     * 게시글의 첨부 파일 목록 조회
     * @param board 게시글
     * @return 첨부 파일 목록
     */
    List<BoardFile> findByBoard(Board board);
    
}



