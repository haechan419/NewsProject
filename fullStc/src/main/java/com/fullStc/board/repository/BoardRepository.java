package com.fullStc.board.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.Board;

/**
 * 게시글 레포지토리
 * 게시글 엔티티에 대한 데이터베이스 접근을 제공하는 인터페이스
 */
@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
    /**
     * 삭제되지 않은 게시글 목록 조회 (최신순)
     * @param pageable 페이지 정보
     * @return 게시글 페이지
     */
    Page<Board> findByIsDeletedFalseOrderByCreatedAtDesc(Pageable pageable);

    /**
     * 타입별 삭제되지 않은 게시글 목록 조회 (최신순)
     * @param boardType 게시판 타입
     * @param pageable 페이지 정보
     * @return 게시글 페이지
     */
    Page<Board> findByBoardTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            Board.BoardType boardType, Pageable pageable);

    /**
     * 키워드로 게시글 검색
     * 제목 또는 내용에 키워드가 포함된 삭제되지 않은 게시글을 검색합니다.
     * @param keyword 검색 키워드
     * @param pageable 페이지 정보
     * @return 게시글 페이지
     */
    @Query("SELECT b FROM Board b WHERE b.isDeleted = false " +
           "AND (b.title LIKE %:keyword% OR b.content LIKE %:keyword%) " +
           "ORDER BY b.createdAt DESC")
    Page<Board> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}

