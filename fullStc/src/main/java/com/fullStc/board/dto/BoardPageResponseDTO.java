package com.fullStc.board.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 게시글 페이징 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardPageResponseDTO {
    private List<BoardListResponseDTO> boards;
    private long totalCount;
    private int currentPage;
    private int totalPages;
    private int limit;
    private boolean hasNext;
    private boolean hasPrevious;
}








