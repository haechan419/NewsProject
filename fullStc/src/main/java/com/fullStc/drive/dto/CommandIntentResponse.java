package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandIntentResponse {
    private String intent; // NEXT, PREV, PAUSE, RESUME, SAVE, STOP 등
    private Float confidence; // 0.0 ~ 1.0
    private Boolean processedLocally; // Java에서 처리했는지 여부
    private String message; // 처리 결과 메시지
    private String rawText; // STT 변환 원문 (화면 표시용)
}

