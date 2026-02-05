package com.fullStc.briefdelivery.repository;

import com.fullStc.briefdelivery.entity.BriefDeliverySchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

/**
 * 브리핑 배송 예약 레포지토리
 */
public interface BriefDeliveryScheduleRepository extends JpaRepository<BriefDeliverySchedule, Long> {

    /**
     * 실행 시각이 지났고 상태가 PENDING인 예약 목록 조회
     */
    List<BriefDeliverySchedule> findByStatusAndScheduledAtBeforeOrderByScheduledAtAsc(String status, Instant now);

    List<BriefDeliverySchedule> findByUserIdOrderByScheduledAtDesc(Long userId);

    BriefDeliverySchedule findTopByUserIdOrderByCreatedAtDesc(Long userId);
}
