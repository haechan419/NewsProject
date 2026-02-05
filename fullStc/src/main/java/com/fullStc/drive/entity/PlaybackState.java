package com.fullStc.drive.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "playback_state")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlaybackState {
    @Id
    private Long userId;

    @Column(nullable = false, length = 64)
    private String playlistId;

    @Column(name = "playback_seconds", nullable = false) @Builder.Default
    private Integer currentTime = 0;

    @Column(nullable = false) @Builder.Default
    private Boolean isActive = false;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}