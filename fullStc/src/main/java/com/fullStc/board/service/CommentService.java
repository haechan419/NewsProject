package com.fullStc.board.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fullStc.board.domain.Board;
import com.fullStc.board.domain.BoardComment;
import com.fullStc.board.domain.CommentFile;
import com.fullStc.board.domain.CommentLike;
import com.fullStc.board.dto.*;
import com.fullStc.board.repository.*;
import com.fullStc.member.domain.Member;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.repository.MemberRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

/**
 * 댓글 서비스
 * 댓글 조회, 생성, 수정, 삭제, 좋아요 기능을 제공하는 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class CommentService {
    private final BoardCommentRepository commentRepository;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final CommentFileRepository commentFileRepository;
    private final FileStorageService fileStorageService;

    /**
     * 현재 로그인한 사용자 정보 가져오기
     * SecurityContext에서 인증된 사용자의 Member 엔티티를 조회합니다.
     * @return 현재 로그인한 사용자의 Member 엔티티 (인증되지 않은 경우 null)
     */
    /**
     * 현재 로그인한 사용자 정보 가져오기
     * SecurityContext에서 인증된 사용자의 Member 엔티티를 조회합니다.
     * @return 현재 로그인한 사용자의 Member 엔티티 (인증되지 않았거나 Member를 찾을 수 없는 경우 null)
     */
    private Member getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated()) {
                log.debug("인증 정보가 없습니다");
                return null;
            }
            
            Object principal = authentication.getPrincipal();
            
            if (principal instanceof MemberDTO) {
                MemberDTO memberDTO = (MemberDTO) principal;
                Long memberId = memberDTO.getId();
                log.debug("사용자 ID 조회 시도: {}", memberId);
                
                Member member = memberRepository.findById(memberId)
                        .orElse(null);
                
                if (member == null) {
                    log.warn("Member를 찾을 수 없습니다: memberId={}. JWT에는 존재하지만 데이터베이스에 없습니다.", memberId);
                    return null; // 예외를 던지지 않고 null 반환
                }
                
                return member;
            } else {
                log.debug("Principal이 MemberDTO가 아닙니다: {}", principal.getClass().getName());
            }
        } catch (Exception e) {
            log.warn("사용자 정보 조회 실패: {}", e.getMessage());
            return null; // 예외를 던지지 않고 null 반환
        }
        
        return null;
    }

    /**
     * 현재 로그인한 사용자를 안전하게 가져오기 (예외 발생 시 null 반환)
     * @return 현재 로그인한 사용자의 Member 엔티티 (없거나 예외 발생 시 null)
     */
    private Member getCurrentUserOrNull() {
        try {
            return getCurrentUser();
        } catch (Exception e) {
            log.debug("사용자 정보 조회 실패 (null 반환): {}", e.getMessage());
            return null;
        }
    }

    /**
     * 게시글의 댓글 목록 조회
     * @param boardId 게시글 ID
     * @return 댓글 응답 목록 (대댓글 포함)
     */
    public List<CommentResponseDTO> getComments(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + boardId));

        // 현재 로그인한 사용자 가져오기 (없으면 null)
        final Member user = getCurrentUserOrNull();

        List<BoardComment> comments = commentRepository.findByBoardAndParentCommentIsNullAndIsDeletedFalseOrderByCreatedAtAsc(board);

        return comments.stream()
                .map(comment -> {
                    // user가 null이면 isLiked는 false
                    // user가 null이 아니더라도 안전하게 처리
                    boolean isLiked = false;
                    if (user != null) {
                        try {
                            isLiked = commentLikeRepository.existsByCommentAndUser(comment, user);
                        } catch (Exception e) {
                            log.debug("댓글 좋아요 여부 확인 중 오류 발생 (무시): {}", e.getMessage());
                            isLiked = false;
                        }
                    }
                    return CommentResponseDTO.from(comment, isLiked);
                })
                .collect(Collectors.toList());
    }

    /**
     * 댓글 생성
     * @param request 댓글 생성 요청 DTO
     * @return 생성된 댓글 ID를 담은 응답 DTO
     */
    @Transactional
public CommentCreateResponseDTO createComment(CommentCreateRequestDTO request, MultipartFile[] files) {
    Board board = boardRepository.findById(request.getBoardId())
            .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + request.getBoardId()));

    Member user = getCurrentUser();
    if (user == null) {
        throw new RuntimeException("인증되지 않은 사용자입니다");
    }

    BoardComment parentComment = null;
    if (request.getParentCommentId() != null) {
        parentComment = commentRepository.findById(request.getParentCommentId())
                .orElseThrow(() -> new RuntimeException("부모 댓글을 찾을 수 없습니다: " + request.getParentCommentId()));

        // 대댓글의 대댓글은 불가
        if (parentComment.getParentComment() != null) {
            throw new RuntimeException("대댓글에는 댓글을 달 수 없습니다");
        }
    }

    BoardComment comment = BoardComment.builder()
            .board(board)
            .user(user)
            .content(request.getContent())
            .parentComment(parentComment)
            .build();

    BoardComment savedComment = commentRepository.save(comment);

    // 파일 업로드 처리
    if (files != null && files.length > 0) {
        List<FileStorageService.FileInfo> fileInfos = fileStorageService.storeFiles(files);
        for (FileStorageService.FileInfo fileInfo : fileInfos) {
            CommentFile commentFile = CommentFile.builder()
                    .comment(savedComment)
                    .originalFileName(fileInfo.getOriginalFileName())
                    .storedFileName(fileInfo.getStoredFileName())
                    .filePath(fileInfo.getFilePath())
                    .fileSize(fileInfo.getFileSize())
                    .fileType(fileInfo.getFileType())
                    .build();
            commentFileRepository.save(commentFile);
        }
    }

    board.increaseCommentCount();
    boardRepository.save(board);

    return new CommentCreateResponseDTO(savedComment.getId());
}

    /**
     * 댓글 수정
     * 작성자 본인만 수정 가능합니다.
     * @param commentId 댓글 ID
     * @param request 댓글 수정 요청 DTO
     */
    @Transactional
    public void updateComment(Long commentId, CommentUpdateRequestDTO request) {
        BoardComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다: " + commentId));

        if (comment.getIsDeleted()) {
            throw new RuntimeException("삭제된 댓글입니다: " + commentId);
        }

        // 인증 및 권한 체크
        Member currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("인증되지 않은 사용자입니다");
        }

        // 작성자 본인만 수정 가능
        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("댓글 수정 권한이 없습니다");
        }

        comment.update(request.getContent());
        commentRepository.save(comment);
    }

    /**
     * 댓글 삭제 (soft delete)
     * 작성자 본인만 삭제 가능합니다.
     * 게시글의 댓글 수도 함께 감소시킵니다.
     * @param commentId 댓글 ID
     */
    @Transactional
    public void deleteComment(Long commentId) {
        BoardComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다: " + commentId));

        // 인증 및 권한 체크
        Member currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("인증되지 않은 사용자입니다");
        }

        // 작성자 본인만 삭제 가능
        if (!comment.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("댓글 삭제 권한이 없습니다");
        }

        comment.delete();
        commentRepository.save(comment);

        // 게시글 댓글 수 감소
        Board board = comment.getBoard();
        board.decreaseCommentCount();
        boardRepository.save(board);
    }

    /**
     * 댓글 좋아요 토글
     * 좋아요가 이미 있으면 취소, 없으면 추가합니다.
     * @param commentId 댓글 ID
     * @return 좋아요 상태를 담은 응답 DTO
     */
    @Transactional
    public LikeResponseDTO toggleLike(Long commentId) {
        BoardComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("댓글을 찾을 수 없습니다: " + commentId));

        Member user = getCurrentUser();
        if (user == null) {
            throw new RuntimeException("인증되지 않은 사용자입니다");
        }

        boolean isLiked = commentLikeRepository.existsByCommentAndUser(comment, user);

        if (isLiked) {
            // 좋아요 취소
            commentLikeRepository.findByCommentAndUser(comment, user)
                    .ifPresent(commentLikeRepository::delete);
            comment.decreaseLikeCount();
        } else {
            // 좋아요 추가
            CommentLike like = CommentLike.builder()
                    .comment(comment)
                    .user(user)
                    .build();
            commentLikeRepository.save(like);
            comment.increaseLikeCount();
        }

        commentRepository.save(comment);
        return new LikeResponseDTO(!isLiked);
    }
}

