package com.fullStc.drive.repository;

import com.fullStc.drive.entity.DriveHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DriveHistoryRepository extends JpaRepository<DriveHistory, Long> {
    List<DriveHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    // 2+1 알고리즘: 사용자가 가장 높은 완독률을 보인 상위 카테고리 조회
    @Query("SELECT h.category, COUNT(h) as count " +
           "FROM DriveHistory h " +
           "WHERE h.userId = :userId AND h.status = 'COMPLETED' " +
           "GROUP BY h.category " +
           "ORDER BY count DESC")
    List<Object[]> findTopCategoriesByUserId(@Param("userId") Long userId);
    
    /**
     * 특정 날짜 이전의 히스토리 조회
     */
    List<DriveHistory> findByCreatedAtBefore(LocalDateTime date);
    
    /**
     * 최근 1시간 내 같은 플레이리스트의 히스토리 조회
     */
    List<DriveHistory> findByUserIdAndPlaylistIdAndCreatedAtAfter(
            Long userId, String playlistId, LocalDateTime createdAt);
}

