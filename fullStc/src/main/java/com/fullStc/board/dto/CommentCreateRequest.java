package com.fullStc.board.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateRequest {
    private Long boardId;
    private String content;
    private Long parentCommentId;
}

