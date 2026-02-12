package com.fullStc.ai.repository;

import com.fullStc.ai.domain.VideoTask;
import org.springframework.data.domain.Pageable; // ◀ 반드시 있어야 함
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;

public interface VideoTaskRepository extends JpaRepository<VideoTask, Long> {

    void deleteAllByStatus(String status);

    boolean existsByMemberIdAndStatusIn(Long memberId, Collection<String> statuses);

    // 중복 메서드 하나로 통합 (Long 타입 사용)
    List<VideoTask> findByMemberIdAndStatusIn(Long memberId, Collection<String> statuses);

    List<VideoTask> findByMemberIdAndStatusInOrderByRegDateDesc(Long memberId, Collection<String> statuses);

    List<VideoTask> findByMemberIdOrderByRegDateDesc(Long memberId);

    // Pageable을 정상적으로 인식하도록 설정
    @Query("SELECT v FROM VideoTask v WHERE v.isMainHot = true AND v.status = :status ORDER BY v.vno DESC")
    List<VideoTask> findMainHotVideos(@Param("status") String status, Pageable pageable);

    // status로 조회 (모든 멤버의 작업 조회용)
    List<VideoTask> findByStatusIn(Collection<String> statuses);
}