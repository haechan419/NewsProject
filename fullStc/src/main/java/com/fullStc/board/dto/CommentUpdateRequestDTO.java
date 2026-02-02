package com.fullStc.board.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 댓글 수정 요청 DTO
 * 댓글 수정 시 클라이언트로부터 받는 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CommentUpdateRequestDTO {
    private String content; // 수정할 댓글 내용
}

