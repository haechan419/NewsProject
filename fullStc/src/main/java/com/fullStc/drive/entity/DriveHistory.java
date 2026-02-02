package com.fullStc.drive.entity;

import com.fullStc.drive.enums.HistoryStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "drive_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DriveHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long historyId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 64)
    private String playlistId;

    @Column(nullable = false, length = 100)
    private String playlistTitle;

    @Column(nullable = false, length = 20)
    private String category;

    @Column(name = "news_list", columnDefinition = "JSON")
    private String newsList;

    @Column(nullable = true, length = 255)
    private String ttsFilePath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HistoryStatus status;

    @Column(nullable = false) @Builder.Default
    private Integer listenDuration = 0;

    /** 마지막 재생 위치(초). DB 컬럼명은 예약어 회피를 위해 playback_position 사용 */
    @Column(name = "playback_position", nullable = true)
    private Integer currentTime;

    @CreationTimestamp
    private LocalDateTime createdAt;

    /** DB에 기본값 없을 때 INSERT 오류 방지 */
    @Column(name = "is_recommended", nullable = false)
    @Builder.Default
    private Boolean isRecommended = false;

    /** 플레이리스트 히스토리에서는 null, 단건 뉴스 기록 시 사용. DB: varchar(64) */
    @Column(name = "news_id", nullable = true, length = 64)
    private String newsId;

    /** 단건 뉴스 이어듣기 시 마지막 문장 인덱스. 플레이리스트 방식에서는 사용 안 함(null/0). 재생 위치는 playback_position(초) 사용 */
    @Column(name = "last_sentence_idx", nullable = true)
    private Integer lastSentenceIdx;
}   