package com.fullStc.board.dto;

import com.fullStc.board.domain.Board;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class BoardCreateRequestDTO {
    private String boardType;
    private String title;
    private String content;
    private String debateTopic;

    public Board.BoardType getBoardTypeEnum() {
        return Board.BoardType.valueOf(boardType.toUpperCase());
    }
}

