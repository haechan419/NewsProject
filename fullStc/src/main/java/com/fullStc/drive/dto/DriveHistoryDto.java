package com.fullStc.drive.dto;

import com.fullStc.drive.enums.HistoryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriveHistoryDto {
    private Long historyId;
    private Long userId;
    private String playlistId;
    private String playlistTitle;
    private String category;
    private List<NewsItemDto> newsList;
    private HistoryStatus status;
    private Integer listenDuration;
    private Integer currentTime;
    private LocalDateTime createdAt;
    /** 단건 뉴스 이어듣기 시 마지막 문장 인덱스 */
    private Integer lastSentenceIdx;
}
