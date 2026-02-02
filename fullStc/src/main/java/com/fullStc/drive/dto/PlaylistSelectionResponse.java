package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 플레이리스트 선택 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistSelectionResponse {
    private Long historyId;
    private String playlistId;
    private String playlistTitle;
    private List<NewsItemDto> newsList;
    private String audioUrl;
    /**
     * 같은 뉴스 목록인지 여부 (최근 1시간 내)
     */
    @Builder.Default
    private Boolean isDuplicate = false;
    /**
     * 중복 시 표시할 메시지
     */
    private String message;
}

