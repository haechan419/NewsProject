package com.fullStc.drive.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 플레이리스트 선택 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistSelectionRequest {
    @NotBlank(message = "플레이리스트 ID는 필수입니다")
    private String playlistId;
}
