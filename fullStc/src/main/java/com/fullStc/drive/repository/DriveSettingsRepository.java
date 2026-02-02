package com.fullStc.drive.repository;

import com.fullStc.drive.entity.DriveSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriveSettingsRepository extends JpaRepository<DriveSettings, Long> {
    Optional<DriveSettings> findByUserId(Long userId);
}

