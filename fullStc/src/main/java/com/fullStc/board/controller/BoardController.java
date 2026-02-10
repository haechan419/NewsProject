package com.fullStc.board.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fullStc.board.dto.*;
import com.fullStc.board.service.BoardService;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {
    private final BoardService boardService;
    private final ObjectMapper objectMapper;

    @GetMapping
<<<<<<< HEAD
    public ResponseEntity<BoardPageResponseDTO> getBoards(
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(boardService.getBoards(offset, limit));
    }

    @GetMapping("/type/{boardType}")
    public ResponseEntity<BoardPageResponseDTO> getBoardsByType(
=======
    public ResponseEntity<Page<BoardListResponseDTO>> getBoards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(boardService.getBoards(page, size));
    }

    @GetMapping("/type/{boardType}")
    public ResponseEntity<Page<BoardListResponseDTO>> getBoardsByType(
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
            @PathVariable String boardType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(boardService.getBoardsByType(boardType, page, size));
    }

    @GetMapping("/search")
<<<<<<< HEAD
    public ResponseEntity<BoardPageResponseDTO> searchBoards(
            @RequestParam String keyword,
            @RequestParam(required = false, defaultValue = "TITLE_CONTENT") String searchType,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(boardService.searchBoards(keyword, searchType, offset, limit));
=======
    public ResponseEntity<Page<BoardListResponseDTO>> searchBoards(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(boardService.searchBoards(keyword, page, size));
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    }

    @GetMapping("/{boardId}")
    public ResponseEntity<BoardDetailResponseDTO> getBoardDetail(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardService.getBoardDetail(boardId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BoardCreateResponseDTO> createBoard(
            @RequestPart("board") String boardJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        try {
            BoardCreateRequestDTO request = objectMapper.readValue(boardJson, BoardCreateRequestDTO.class);
            return ResponseEntity.ok(boardService.createBoard(request, files));
        } catch (Exception e) {
            throw new RuntimeException("게시글 생성 실패: " + e.getMessage());
        }
    }
    @PutMapping(value = "/{boardId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> updateBoard(
            @PathVariable Long boardId,
            @RequestPart("board") String boardJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        try {
            BoardUpdateRequestDTO request = objectMapper.readValue(boardJson, BoardUpdateRequestDTO.class);
            boardService.updateBoard(boardId, request, files);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            throw new RuntimeException("게시글 수정 실패: " + e.getMessage());
        }
    }

    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long boardId) {
        boardService.deleteBoard(boardId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{boardId}/like")
    public ResponseEntity<LikeResponseDTO> toggleLike(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardService.toggleLike(boardId));
    }

    @PostMapping("/{boardId}/vote")
    public ResponseEntity<VoteResponseDTO> vote(
            @PathVariable Long boardId,
            @RequestBody VoteRequestDTO request) {
        return ResponseEntity.ok(boardService.vote(boardId, request));
    }
}

