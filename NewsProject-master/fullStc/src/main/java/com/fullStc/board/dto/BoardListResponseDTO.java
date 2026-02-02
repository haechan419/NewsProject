package com.fullStc.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.fullStc.board.domain.Board;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardListResponseDTO {
    private Long id;
    private String boardType;
    private String title;
    private String writerNickname;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private LocalDateTime createdAt;
    private String debateTopic;
    private Integer agreeCount;
    private Integer disagreeCount;
    private String thumbnailUrl;

    public static BoardListResponseDTO from(Board board) {
        String thumbnailUrl = null;
        if (board.getFiles() != null && !board.getFiles().isEmpty()) {
            // 첫 번째 이미지 파일의 썸네일 찾기
            thumbnailUrl = board.getFiles().stream()
                    .filter(file -> {
                        String fileName = file.getOriginalFileName().toLowerCase();
                        return fileName.matches(".*\\.(jpg|jpeg|png|gif|bmp|webp)$");
                    })
                    .map(file -> "/api/files/thumbnails/" + file.getStoredFileName())
                    .findFirst()
                    .orElse(null);
        }

        return BoardListResponseDTO.builder()
                .id(board.getId())
                .boardType(board.getBoardType().name())
                .title(board.getTitle())
                .writerNickname(board.getUser().getNickname())
                .viewCount(board.getViewCount())
                .likeCount(board.getLikeCount())
                .commentCount(board.getCommentCount())
                .createdAt(board.getCreatedAt())
                .debateTopic(board.getDebateTopic())
                .agreeCount(board.getAgreeCount())
                .disagreeCount(board.getDisagreeCount())
                .thumbnailUrl(thumbnailUrl)
                .build();
    }
}

