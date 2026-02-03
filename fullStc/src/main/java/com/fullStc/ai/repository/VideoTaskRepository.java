package com.fullStc.ai.repository;

import com.fullStc.ai.domain.VideoTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Collection;

public interface VideoTaskRepository extends JpaRepository<VideoTask, Long> {
    void deleteAllByStatus(String status);
    boolean existsByMemberIdAndStatusIn(Long memberId, Collection<String> statuses);
    
    // [추가] 취소 처리를 위해 특정 상태의 작업 리스트를 가져오는 메서드
    List<VideoTask> findByMemberIdAndStatusIn(Long memberId, Collection<String> statuses);
    
    List<VideoTask> findByMemberIdAndStatusInOrderByRegDateDesc(Long memberId, Collection<String> statuses);
    List<VideoTask> findByMemberIdOrderByRegDateDesc(Long memberId);
}