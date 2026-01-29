package com.fullStc.board.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fullStc.board.dto.*;
import com.fullStc.board.service.CommentService;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CommentController {
    private final CommentService commentService;

    @GetMapping("/board/{boardId}")
    public ResponseEntity<List<CommentResponseDTO>> getComments(@PathVariable Long boardId) {
        return ResponseEntity.ok(commentService.getComments(boardId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<CommentCreateResponseDTO> createComment(
        @RequestPart("comment") String commentJson,
        @RequestPart(value = "files", required = false) MultipartFile[] files) {
    try {
        ObjectMapper objectMapper = new ObjectMapper();
        CommentCreateRequestDTO request = objectMapper.readValue(commentJson, CommentCreateRequestDTO.class);
        return ResponseEntity.ok(commentService.createComment(request, files));
    } catch (Exception e) {
        throw new RuntimeException("댓글 작성 실패: " + e.getMessage());
    }
}

    @PutMapping("/{commentId}")
    public ResponseEntity<Void> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentUpdateRequestDTO request) {
        commentService.updateComment(commentId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<LikeResponseDTO> toggleLike(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.toggleLike(commentId));
    }
}

