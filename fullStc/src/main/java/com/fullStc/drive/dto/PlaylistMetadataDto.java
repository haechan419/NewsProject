package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 플레이리스트 메타데이터 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistMetadataDto {
    private String id;
    private String title;
    private String description;
    private Integer expectedCount;
}
