package com.fullStc.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.fullStc.board.domain.BoardFile;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardFileResponse {
    private Long id;
    private String originalFileName;
    private String storedFileName;
    private String filePath;
    private Long fileSize;
    private String fileType;
    private LocalDateTime createdAt;

    public static BoardFileResponse from(BoardFile file) {
        return BoardFileResponse.builder()
                .id(file.getId())
                .originalFileName(file.getOriginalFileName())
                .storedFileName(file.getStoredFileName())
                .filePath(file.getFilePath())
                .fileSize(file.getFileSize())
                .fileType(file.getFileType())
                .createdAt(file.getCreatedAt())
                .build();
    }
}

