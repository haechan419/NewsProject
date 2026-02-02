package com.fullStc.drive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 텍스트 기반 명령 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TextCommandRequest {
    /**
     * 사용자 입력 텍스트
     */
    @NotBlank(message = "텍스트는 필수입니다")
    private String text;
    
    /**
     * 사용자 ID
     */
    @NotNull(message = "사용자 ID는 필수입니다")
    private Long userId;
    
    /**
     * 뉴스 큐 (선택적 - DJ 스크립트 생성 시 필요)
     */
    private List<NewsSummaryDto> newsQueue;
}

