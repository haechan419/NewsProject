package com.fullStc.drive.repository;

import com.fullStc.drive.entity.PlaybackState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaybackStateRepository extends JpaRepository<PlaybackState, Long> {
    Optional<PlaybackState> findByUserId(Long userId);
    List<PlaybackState> findByIsActiveTrue();
}

