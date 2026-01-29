package com.fullStc.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.fullStc.board.domain.Board;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardDetailResponseDTO {
    private Long id;
    private String boardType;
    private String title;
    private String content;
    private Long writerId;
    private String writerNickname;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private String debateTopic;
    private Integer agreeCount;
    private Integer disagreeCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BoardFileResponseDTO> files;
    private Boolean isLiked;
    private String myVoteType;

    public static BoardDetailResponseDTO from(Board board, Boolean isLiked, String myVoteType) {
        return BoardDetailResponseDTO.builder()
                .id(board.getId())
                .boardType(board.getBoardType().name())
                .title(board.getTitle())
                .content(board.getContent())
                .writerId(board.getUser().getId())
                .writerNickname(board.getUser().getNickname())
                .viewCount(board.getViewCount())
                .likeCount(board.getLikeCount())
                .commentCount(board.getCommentCount())
                .debateTopic(board.getDebateTopic())
                .agreeCount(board.getAgreeCount())
                .disagreeCount(board.getDisagreeCount())
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .files(board.getFiles().stream()
                        .map(BoardFileResponseDTO::from)
                        .collect(Collectors.toList()))
                .isLiked(isLiked)
                .myVoteType(myVoteType)
                .build();
    }
}

