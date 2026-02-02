package com.fullStc.drive.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "drive_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DriveSettings {
    @Id
    private Long userId; // PK이자 FK (User 테이블 연결)

    @Column(nullable = false) @Builder.Default
    private Float voiceSpeed = 1.0f;

    @Column(nullable = false, length = 20) @Builder.Default
    private String voiceType = "nova";

    @Column(nullable = false) @Builder.Default
    private Boolean autoPlay = true;

    @Column(nullable = false) @Builder.Default
    private Integer volLevel = 80;

    @Column(nullable = false, length = 20) @Builder.Default
    private String startMode = "SUGGEST";

    @Column(nullable = false) @Builder.Default
    private Boolean recEnabled = true;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}