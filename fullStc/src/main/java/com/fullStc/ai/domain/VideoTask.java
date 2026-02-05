package com.fullStc.ai.domain;

import com.fullStc.member.domain.Member;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    private Long newsId;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String rawText;

    private String customTitle;

    @Builder.Default
    @Column(length = 32)
    private String category = "politics";

    @Column(nullable = false)
    private String videoMode;

    @Builder.Default
    private String status = "PENDING";

    private String videoUrl;
    private String imgUrl;

    private boolean isVipAuto;
    private boolean isMainHot;
    
    @CreatedDate
    @Column(name = "regdate", updatable = false)
    private LocalDateTime regDate;

    @LastModifiedDate
    @Column(name = "moddate")
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