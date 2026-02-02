package com.fullStc.ai.repository;

import com.fullStc.ai.domain.VideoTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Collection;

public interface VideoTaskRepository extends JpaRepository<VideoTask, Long> {
    void deleteAllByStatus(String status);

    boolean existsByMemberIdAndStatusIn(Long memberId, Collection<String> statuses);

    // member 객체 내부의 id를 참조하도록 메서드명을 맞췄습니다
    List<VideoTask> findByMemberIdAndStatusInOrderByRegDateDesc(Long memberId, Collection<String> statuses);

    List<VideoTask> findByMemberIdOrderByRegDateDesc(Long memberId);
}