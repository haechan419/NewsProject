package com.fullStc.drive.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "drive_command_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DriveCommandLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId; // 자동 생성되는 PK

    @Column(nullable = false)
    private Long userId; // 사용자 식별자 (FK)

    @Column(nullable = false, columnDefinition = "TEXT")
    private String rawText; // STT 변환 원문

    @Column(length = 50)
    private String intent; // 파싱된 명령 의도

    private Float confScore; // 신뢰도 점수

    @Column(nullable = false)
    private Boolean isSuccess; // 성공 여부

    @Column(columnDefinition = "TEXT")
    private String errorMsg; // 실패 시 에러 내용

    @CreationTimestamp
    private LocalDateTime createdAt; // 발생 시간
}