package com.fullStc.board.dto;

import com.fullStc.board.domain.DebateVote;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class VoteRequestDTO {
    private Long boardId;
    private String voteType;

    public DebateVote.VoteType getVoteTypeEnum() {
        return DebateVote.VoteType.valueOf(voteType.toUpperCase());
    }
}

