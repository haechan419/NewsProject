package com.fullStc.support.repository;

import com.fullStc.support.domain.Faq;
import com.fullStc.support.domain.FaqCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * FAQ Repository
 */
public interface FaqRepository extends JpaRepository<Faq, Long> {

    /**
     * 카테고리별 FAQ 목록 조회
     */
    List<Faq> findByCategoryOrderByViewCountDesc(FaqCategory category);

    /**
     * 전체 FAQ 목록 조회 (조회수 내림차순)
     */
    List<Faq> findAllByOrderByViewCountDesc();

    /**
     * 키워드 검색 (질문, 답변, 키워드 필드에서 검색)
     */
    @Query("SELECT f FROM Faq f WHERE " +
           "LOWER(f.question) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(f.answer) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(f.keywords) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Faq> searchByKeyword(@Param("keyword") String keyword);

    /**
     * 카테고리와 키워드로 검색
     */
    @Query("SELECT f FROM Faq f WHERE f.category = :category AND (" +
           "LOWER(f.question) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(f.answer) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(f.keywords) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Faq> searchByCategoryAndKeyword(@Param("category") FaqCategory category, 
                                          @Param("keyword") String keyword);
}
