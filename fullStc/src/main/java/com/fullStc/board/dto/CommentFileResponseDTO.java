package com.fullStc.board.dto;

import com.fullStc.board.domain.CommentFile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentFileResponseDTO {
    private Long id;
    private String originalFileName;
    private String storedFileName;
    private Long fileSize;
    private String fileType;

    public static CommentFileResponseDTO from(CommentFile file) {
        return CommentFileResponseDTO.builder()
                .id(file.getId())
                .originalFileName(file.getOriginalFileName())
                .storedFileName(file.getStoredFileName())
                .fileSize(file.getFileSize())
                .fileType(file.getFileType())
                .build();
    }
}