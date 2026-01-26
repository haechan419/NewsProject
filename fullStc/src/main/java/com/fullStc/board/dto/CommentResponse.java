package com.fullStc.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.fullStc.board.domain.BoardComment;

/**
 * 댓글 응답 DTO
 * 댓글 정보를 클라이언트에 전달하기 위한 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentResponse {
    private Long id; // 댓글 ID
    private Long boardId; // 게시글 ID
    private String content; // 댓글 내용
    private Long writerId; // 작성자 ID
    private String writerNickname; // 작성자 닉네임
    private Long parentCommentId; // 부모 댓글 ID (대댓글인 경우)
    private List<CommentResponse> replies; // 대댓글 목록
    private Integer likeCount; // 좋아요 수
    private Boolean isLiked; // 현재 사용자가 좋아요를 눌렀는지 여부
    private Boolean isDeleted; // 삭제 여부
    private LocalDateTime createdAt; // 생성 시간
    private LocalDateTime updatedAt; // 수정 시간
    private List<CommentFileResponse> files; // 첨부 파일 목록


    /**
     * BoardComment 엔티티를 CommentResponse DTO로 변환
     * @param comment 댓글 엔티티
     * @param isLiked 현재 사용자가 좋아요를 눌렀는지 여부
     * @return CommentResponse DTO
     */
    public static CommentResponse from(BoardComment comment, Boolean isLiked) {
        List<CommentResponse> replies = comment.getReplies().stream()
                .filter(reply -> !reply.getIsDeleted())
                .map(reply -> CommentResponse.from(reply, false))
                .collect(Collectors.toList());

        return CommentResponse.builder()
                .id(comment.getId())
                .boardId(comment.getBoard().getId())
                .content(comment.getIsDeleted() ? "삭제된 댓글입니다." : comment.getContent())
                .writerId(comment.getUser().getId())
                .writerNickname(comment.getUser().getNickname())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .replies(replies)
                .likeCount(comment.getLikeCount())
                .isLiked(isLiked)
                .isDeleted(comment.getIsDeleted())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .files(comment.getFiles() != null 
    ? comment.getFiles().stream()
        .map(CommentFileResponse::from)
        .collect(Collectors.toList())
    : List.of())
                .build();
    }
}

