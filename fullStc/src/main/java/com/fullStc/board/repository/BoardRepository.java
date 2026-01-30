package com.fullStc.board.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fullStc.board.domain.Board;

import java.util.List;

/**
 * 게시글 레포지토리
 * 게시글 엔티티에 대한 데이터베이스 접근을 제공하는 인터페이스
 */
@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
    /**
     * 삭제되지 않은 게시글 목록 조회 (최신순, offset/limit 적용)
     * @param offset 시작 위치
     * @param limit 조회할 개수
     * @return 게시글 목록
     */
    @Query(value = "SELECT * FROM board WHERE is_deleted = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Board> findByIsDeletedFalseOrderByCreatedAtDesc(@Param("offset") int offset, @Param("limit") int limit);

    /**
     * 타입별 삭제되지 않은 게시글 목록 조회 (최신순, offset/limit 적용)
     * @param boardType 게시판 타입
     * @param offset 시작 위치
     * @param limit 조회할 개수
     * @return 게시글 목록
     */
    @Query(value = "SELECT * FROM board WHERE board_type = :boardType AND is_deleted = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Board> findByBoardTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            @Param("boardType") String boardType, 
            @Param("offset") int offset, 
            @Param("limit") int limit);

    /**
     * 키워드로 게시글 검색
     * 제목 또는 내용에 키워드가 포함된 삭제되지 않은 게시글을 검색합니다.
     * @param keyword 검색 키워드
     * @param offset 시작 위치
     * @param limit 조회할 개수
     * @return 게시글 목록
     */
    @Query(value = "SELECT * FROM board WHERE is_deleted = false " +
           "AND (title LIKE %:keyword% OR content LIKE %:keyword%) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Board> searchByKeyword(
            @Param("keyword") String keyword, 
            @Param("offset") int offset, 
            @Param("limit") int limit);
}

