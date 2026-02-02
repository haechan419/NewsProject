package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriveEntryResponse {
    private String scenario; // RESUME_BRIEFING, NEW_BRIEFING, FIRST_TIME_WELCOME
    private String newsId; // 이어듣기 시 필요
    private Integer lastSentenceIdx; // 이어듣기 시 필요
    private NewsQueueResponse newsQueue; // NEW_BRIEFING 시 제공
    // settings 필드 제거: 설정 기능이 비활성화되어 있음
    private String briefingAudioUrl; // 고정 멘트 오디오 URL (진입 시나리오별)
    private String briefingScript; // 고정 멘트 스크립트 (디버깅용)
    private String djBriefingAudioUrl; // DJ 브리핑 오디오 URL (뉴스 큐 소개)
    private String djBriefingScript; // DJ 브리핑 스크립트 (디버깅용)
    // RESUME_BRIEFING 시 이어듣기 대상 뉴스 제목 (프론트 표시용)
    private String resumeNewsTitle;
}
