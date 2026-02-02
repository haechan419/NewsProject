package com.fullStc.mainpage.repository;

import com.fullStc.mainpage.domain.MainPageNews;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 메인페이지 뉴스 Repository
 */
@Repository
public interface MainPageNewsRepository extends JpaRepository<MainPageNews, Long> {

    /**
     * 카테고리별 인기 뉴스 조회 (각 카테고리 1개씩, viewCount 기준)
     * Pageable의 limit를 사용하여 1개만 반환
     */
    @Query("""
        SELECT m FROM MainPageNews m
        WHERE m.category = :category
          AND m.title IS NOT NULL
          AND m.summary IS NOT NULL
        ORDER BY m.viewCount DESC, m.publishedAt DESC
    """)
    List<MainPageNews> findTopByCategoryOrderByViewCount(@Param("category") String category, Pageable pageable);

    /**
     * 사용자 관심 카테고리별 뉴스 조회
     */
    @Query("""
        SELECT m FROM MainPageNews m
        WHERE m.category IN :categories
          AND m.title IS NOT NULL
          AND m.summary IS NOT NULL
        ORDER BY m.viewCount DESC, m.publishedAt DESC
    """)
    List<MainPageNews> findByCategoriesOrderByViewCount(@Param("categories") List<String> categories, Pageable pageable);

    /**
     * 모든 카테고리 목록 조회 (중복 제거)
     */
    @Query("SELECT DISTINCT m.category FROM MainPageNews m WHERE m.category IS NOT NULL")
    List<String> findAllDistinctCategories();

    /**
     * News ID로 조회
     */
    MainPageNews findByNewsId(Long newsId);
}
