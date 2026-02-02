package com.fullStc.ai.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VideoTaskDTO {
    private Long vno;
    private Long memberId;
    private Long newsId;
    private String rawText;
    private String customTitle;
    private String videoMode;
    private String status;
    private String videoUrl;
    private String imgUrl;
    private boolean isVipAuto;
    private boolean isMainHot;
    private LocalDateTime regDate;
    private LocalDateTime modDate;
}