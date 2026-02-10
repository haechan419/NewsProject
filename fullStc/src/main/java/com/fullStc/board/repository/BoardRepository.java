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
<<<<<<< HEAD
    @Query(value = "SELECT * FROM board WHERE board_type = :boardType AND is_deleted = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Board> findByBoardTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            @Param("boardType") String boardType, 
            @Param("offset") int offset, 
            @Param("limit") int limit);
=======
    Page<Board> findByBoardTypeAndIsDeletedFalseOrderByCreatedAtDesc(
            Board.BoardType boardType, Pageable pageable);
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163

    /**
     * 키워드로 게시글 검색 (제목만)
     * @param keyword 검색 키워드
     * @param pageable 페이지 정보
     * @return 게시글 페이지
     */
<<<<<<< HEAD
    @Query(value = "SELECT * FROM board WHERE is_deleted = false " +
           "AND LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Board> searchByTitle(
            @Param("keyword") String keyword, 
            @Param("offset") int offset, 
            @Param("limit") int limit);

    /**
     * 키워드로 게시글 검색 (제목 + 내용)
     * @param keyword 검색 키워드
     * @param offset 시작 위치
     * @param limit 조회할 개수
     * @return 게시글 목록
     */
    @Query(value = "SELECT * FROM board WHERE is_deleted = false " +
           "AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Board> searchByTitleAndContent(
            @Param("keyword") String keyword, 
            @Param("offset") int offset, 
            @Param("limit") int limit);

    /**
     * 키워드로 게시글 검색 (작성자)
     * @param keyword 검색 키워드
     * @param offset 시작 위치
     * @param limit 조회할 개수
     * @return 게시글 목록
     */
    @Query(value = "SELECT b.* FROM board b " +
           "INNER JOIN members m ON b.user_id = m.id " +
           "WHERE b.is_deleted = false " +
           "AND LOWER(m.nickname) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "ORDER BY b.created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Board> searchByWriter(
            @Param("keyword") String keyword, 
            @Param("offset") int offset, 
            @Param("limit") int limit);

    /**
     * 삭제되지 않은 게시글 전체 개수 조회
     * @return 전체 개수
     */
    @Query(value = "SELECT COUNT(*) FROM board WHERE is_deleted = false", nativeQuery = true)
    long countByIsDeletedFalse();

    /**
     * 타입별 삭제되지 않은 게시글 전체 개수 조회
     * @param boardType 게시판 타입
     * @return 전체 개수
     */
    @Query(value = "SELECT COUNT(*) FROM board WHERE board_type = :boardType AND is_deleted = false", nativeQuery = true)
    long countByBoardTypeAndIsDeletedFalse(@Param("boardType") String boardType);

    /**
     * 키워드로 검색된 게시글 전체 개수 조회 (제목만)
     * @param keyword 검색 키워드
     * @return 전체 개수
     */
    @Query(value = "SELECT COUNT(*) FROM board WHERE is_deleted = false " +
           "AND LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%'))", nativeQuery = true)
    long countByTitle(@Param("keyword") String keyword);

    /**
     * 키워드로 검색된 게시글 전체 개수 조회 (제목 + 내용)
     * @param keyword 검색 키워드
     * @return 전체 개수
     */
    @Query(value = "SELECT COUNT(*) FROM board WHERE is_deleted = false " +
           "AND (LOWER(title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(content) LIKE LOWER(CONCAT('%', :keyword, '%')))", nativeQuery = true)
    long countByTitleAndContent(@Param("keyword") String keyword);

    /**
     * 키워드로 검색된 게시글 전체 개수 조회 (작성자)
     * @param keyword 검색 키워드
     * @return 전체 개수
     */
    @Query(value = "SELECT COUNT(*) FROM board b " +
           "INNER JOIN members m ON b.user_id = m.id " +
           "WHERE b.is_deleted = false " +
           "AND LOWER(m.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))", nativeQuery = true)
    long countByWriter(@Param("keyword") String keyword);
=======
    @Query("SELECT b FROM Board b WHERE b.isDeleted = false " +
           "AND (b.title LIKE %:keyword% OR b.content LIKE %:keyword%) " +
           "ORDER BY b.createdAt DESC")
    Page<Board> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
}

