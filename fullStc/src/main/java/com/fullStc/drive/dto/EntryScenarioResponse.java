package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntryScenarioResponse {
    private String scenario; // RESUME_BRIEFING, NEW_BRIEFING, FIRST_TIME_WELCOME
    private String newsId; // 이어듣기 시 필요
    private Integer lastSentenceIdx; // 이어듣기 시 필요
    // RESUME_BRIEFING 시 이어듣기 대상 뉴스 제목 (프론트 표시용)
    private String newsTitle;
}

