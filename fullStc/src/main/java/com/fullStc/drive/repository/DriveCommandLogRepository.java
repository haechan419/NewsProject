package com.fullStc.drive.repository;

import com.fullStc.drive.entity.DriveCommandLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriveCommandLogRepository extends JpaRepository<DriveCommandLog, Long> {
    List<DriveCommandLog> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<DriveCommandLog> findByIntent(String intent);
    
    List<DriveCommandLog> findByIsSuccessFalse();
}

