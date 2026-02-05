package com.fullStc.ai.domain;

import com.fullStc.member.domain.Member; // 팀원 Member 엔티티 임포트
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_video_task")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = "member")
@EntityListeners(AuditingEntityListener.class)
public class VideoTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long vno;

    // 팀 프로젝트의 Member 엔티티와 직접 연관관계를 맺습니다
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    private Long newsId; // 팀 프로젝트 News ID가 Long이므로 타입을 맞췄습니다

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String rawText;

    private String customTitle;

    @Column(nullable = false)
    private String videoMode; // "9:16" 또는 "16:9"

    @Builder.Default
    private String status = "PENDING";

    private String videoUrl;
    private String imgUrl;

    private boolean isVipAuto;
    private boolean isMainHot;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime regDate;

    @LastModifiedDate
    private LocalDateTime modDate;

    public void changeStatus(String status) {
        this.status = status;
    }

    public void updateResult(String videoUrl, String imgUrl) {
        this.videoUrl = videoUrl;
        this.imgUrl = imgUrl;
        this.status = "COMPLETED";
    }
}