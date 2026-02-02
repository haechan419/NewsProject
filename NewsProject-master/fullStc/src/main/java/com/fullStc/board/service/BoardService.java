package com.fullStc.board.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fullStc.board.domain.*;
import com.fullStc.board.dto.*;
import com.fullStc.board.repository.*;
import com.fullStc.board.service.FileStorageService.FileInfo;
import com.fullStc.member.domain.Member;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.repository.MemberRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;


/**
 * 게시판 서비스
 * 게시글 조회, 생성, 수정, 삭제, 좋아요, 투표 기능을 제공하는 서비스
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardService {
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final BoardLikeRepository boardLikeRepository;
    private final DebateVoteRepository debateVoteRepository;
    private final BoardFileRepository boardFileRepository;
    private final FileStorageService fileStorageService;
    private final BoardViewRepository boardViewRepository;

    /**
     * 현재 로그인한 사용자 정보 가져오기
     * SecurityContext에서 인증된 사용자의 Member 엔티티를 조회합니다.
     * @return 현재 로그인한 사용자의 Member 엔티티
     * @throws RuntimeException 인증되지 않은 사용자이거나 사용자를 찾을 수 없는 경우
     */
    private Member getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("인증되지 않은 사용자입니다");
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof MemberDTO) {
            MemberDTO memberDTO = (MemberDTO) principal;
            return memberRepository.findById(memberDTO.getId())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + memberDTO.getId()));
        }
        
        throw new RuntimeException("인증 정보가 올바르지 않습니다");
    }

    /**
     * 게시글 목록 조회 (전체)
     * @param offset 시작 위치
     * @param limit 조회할 개수
     * @return 게시글 목록
     */
    public List<BoardListResponseDTO> getBoards(int offset, int limit) {
        List<Board> boards = boardRepository.findByIsDeletedFalseOrderByCreatedAtDesc(offset, limit);
        return boards.stream()
                .map(BoardListResponseDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 게시글 목록 조회 (타입별)
     * @param boardType 게시판 타입 (NORMAL 또는 DEBATE)
     * @param offset 시작 위치
     * @param limit 조회할 개수
     * @return 게시글 목록
     */
    public List<BoardListResponseDTO> getBoardsByType(String boardType, int offset, int limit) {
        List<Board> boards = boardRepository.findByBoardTypeAndIsDeletedFalseOrderByCreatedAtDesc(boardType, offset, limit);
        return boards.stream()
                .map(BoardListResponseDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 게시글 검색
     * 제목 또는 내용에 키워드가 포함된 게시글을 검색합니다.
     * @param keyword 검색 키워드
     * @param offset 시작 위치
     * @param limit 조회할 개수
     * @return 검색된 게시글 목록
     */
    public List<BoardListResponseDTO> searchBoards(String keyword, int offset, int limit) {
        List<Board> boards = boardRepository.searchByKeyword(keyword, offset, limit);
        return boards.stream()
                .map(BoardListResponseDTO::from)
                .collect(Collectors.toList());
    }

    /**
     * 게시글 상세 조회
     * 사용자당 1일 1회만 조회수가 증가합니다.
     * @param boardId 게시글 ID
     * @return 게시글 상세 응답 DTO
     */
    @Transactional
    public BoardDetailResponseDTO getBoardDetail(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + boardId));

        if (board.getIsDeleted()) {
            throw new RuntimeException("삭제된 게시글입니다: " + boardId);
        }

        // 현재 로그인한 사용자 가져오기
        Member user = getCurrentUser();

        // 1일 1회 조회수 증가 체크
        LocalDate today = LocalDate.now();
        boolean alreadyViewed = boardViewRepository.existsByBoardAndUserAndViewDate(board, user, today);
        
        if (!alreadyViewed) {
            // 오늘 처음 조회한 경우에만 조회수 증가
            board.increaseViewCount();
            boardRepository.save(board);
            
            // 조회 기록 저장
            BoardView boardView = BoardView.builder()
                    .board(board)
                    .user(user)
                    .viewDate(today)
                    .build();
            boardViewRepository.save(boardView);
        }

        // 좋아요 여부 확인
        Boolean isLiked = boardLikeRepository.existsByBoardAndUser(board, user);

        // 투표 여부 확인
        String myVoteType = null;
        if (board.getBoardType() == Board.BoardType.DEBATE) {
            myVoteType = debateVoteRepository.findByBoardAndUser(board, user)
                    .map(vote -> vote.getVoteType().name())
                    .orElse(null);
        }

        return BoardDetailResponseDTO.from(board, isLiked, myVoteType);
    }

    /**
     * 게시글 생성
     * 파일이 첨부된 경우 파일도 함께 저장합니다.
     * @param request 게시글 생성 요청 DTO
     * @param files 첨부 파일 배열
     * @return 생성된 게시글 ID를 담은 응답 DTO
     */
    @Transactional
    public BoardCreateResponseDTO createBoard(BoardCreateRequestDTO request, MultipartFile[] files) {
        // 현재 로그인한 사용자 가져오기
        Member user = getCurrentUser();

        Board board = Board.builder()
                .user(user)
                .boardType(request.getBoardTypeEnum())
                .title(request.getTitle())
                .content(request.getContent())
                .debateTopic(request.getDebateTopic())
                .build();

        Board savedBoard = boardRepository.save(board);

        // 파일 업로드 처리
        if (files != null && files.length > 0) {
            List<FileInfo> fileInfos = fileStorageService.storeFiles(files);
            for (FileInfo fileInfo : fileInfos) {
                BoardFile boardFile = BoardFile.builder()
                        .board(savedBoard)
                        .originalFileName(fileInfo.getOriginalFileName())
                        .storedFileName(fileInfo.getStoredFileName())
                        .filePath(fileInfo.getFilePath())
                        .fileSize(fileInfo.getFileSize())
                        .fileType(fileInfo.getFileType())
                        .build();
                boardFileRepository.save(boardFile);
            }
        }

        return new BoardCreateResponseDTO(savedBoard.getId());
    }

    /**
     * 게시글 수정
     * @param boardId 게시글 ID
     * @param request 게시글 수정 요청 DTO
     * @param files 새로 추가할 파일 배열
     */
    @Transactional
    public void updateBoard(Long boardId, BoardUpdateRequestDTO request, MultipartFile[] files) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + boardId));

        if (board.getIsDeleted()) {
            throw new RuntimeException("삭제된 게시글입니다: " + boardId);
        }

        // 현재 로그인한 사용자 가져오기
        Member currentUser = getCurrentUser();

        // 작성자 본인만 수정 가능
        if (!board.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("게시글 수정 권한이 없습니다");
        }

        // 게시글 내용 수정
        board.update(request.getTitle(), request.getContent());

        // 파일 삭제 처리
        if (request.getDeleteFileIds() != null && !request.getDeleteFileIds().isEmpty()) {
            for (Long fileId : request.getDeleteFileIds()) {
                BoardFile boardFile = boardFileRepository.findById(fileId).orElse(null);
                if (boardFile != null) {
                    fileStorageService.deleteFile(boardFile.getStoredFileName());
                    boardFileRepository.delete(boardFile);
                }
            }
        }

        // 새 파일 추가
        if (files != null && files.length > 0) {
            List<FileInfo> fileInfos = fileStorageService.storeFiles(files);
            for (FileInfo fileInfo : fileInfos) {
                BoardFile boardFile = BoardFile.builder()
                        .board(board)
                        .originalFileName(fileInfo.getOriginalFileName())
                        .storedFileName(fileInfo.getStoredFileName())
                        .filePath(fileInfo.getFilePath())
                        .fileSize(fileInfo.getFileSize())
                        .fileType(fileInfo.getFileType())
                        .build();
                boardFileRepository.save(boardFile);
            }
        }

        boardRepository.save(board);
    }

    /**
     * 게시글 삭제 (soft delete)
     * @param boardId 게시글 ID
     */
    @Transactional
    public void deleteBoard(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + boardId));

        // 현재 로그인한 사용자 가져오기
        Member currentUser = getCurrentUser();

        // 작성자 본인만 삭제 가능
        if (!board.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("게시글 삭제 권한이 없습니다");
        }

        board.delete();
        boardRepository.save(board);
    }

    /**
     * 게시글 좋아요 토글
     * 좋아요가 이미 있으면 취소, 없으면 추가합니다.
     * @param boardId 게시글 ID
     * @return 좋아요 상태를 담은 응답 DTO
     */
    @Transactional
    public LikeResponseDTO toggleLike(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + boardId));

        // 현재 로그인한 사용자 가져오기
        Member user = getCurrentUser();

        boolean isLiked = boardLikeRepository.existsByBoardAndUser(board, user);

        if (isLiked) {
            // 좋아요 취소
            boardLikeRepository.findByBoardAndUser(board, user)
                    .ifPresent(boardLikeRepository::delete);
            board.decreaseLikeCount();
        } else {
            // 좋아요 추가
            BoardLike like = BoardLike.builder()
                    .board(board)
                    .user(user)
                    .build();
            boardLikeRepository.save(like);
            board.increaseLikeCount();
        }

        boardRepository.save(board);
        return new LikeResponseDTO(!isLiked);
    }

    /**
     * 토론 게시판 투표
     * 찬성 또는 반대 투표를 처리합니다. 같은 투표를 다시 누르면 취소됩니다.
     * @param boardId 게시글 ID
     * @param request 투표 요청 DTO
     * @return 투표 결과를 담은 응답 DTO
     */
    @Transactional
    public VoteResponseDTO vote(Long boardId, VoteRequestDTO request) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다: " + boardId));

        if (board.getBoardType() != Board.BoardType.DEBATE) {
            throw new RuntimeException("토론 게시글이 아닙니다: " + boardId);
        }

        // 현재 로그인한 사용자 가져오기
        Member user = getCurrentUser();

        DebateVote.VoteType voteType = request.getVoteTypeEnum();
        DebateVote existingVote = debateVoteRepository.findByBoardAndUser(board, user)
                .orElse(null);

        if (existingVote != null) {
            if (existingVote.getVoteType() == voteType) {
                // 같은 투표 다시 누르면 취소
                debateVoteRepository.delete(existingVote);
                if (voteType == DebateVote.VoteType.AGREE) {
                    board.decreaseAgreeCount();
                } else {
                    board.decreaseDisagreeCount();
                }
                boardRepository.save(board);
                return new VoteResponseDTO(false, null);
            } else {
                // 다른 투표로 변경
                DebateVote.VoteType oldType = existingVote.getVoteType();
                existingVote = DebateVote.builder()
                        .id(existingVote.getId())
                        .board(board)
                        .user(user)
                        .voteType(voteType)
                        .createdAt(existingVote.getCreatedAt())
                        .build();
                debateVoteRepository.save(existingVote);

                if (oldType == DebateVote.VoteType.AGREE) {
                    board.decreaseAgreeCount();
                } else {
                    board.decreaseDisagreeCount();
                }
                if (voteType == DebateVote.VoteType.AGREE) {
                    board.increaseAgreeCount();
                } else {
                    board.increaseDisagreeCount();
                }
            }
        } else {
            // 새 투표
            DebateVote vote = DebateVote.builder()
                    .board(board)
                    .user(user)
                    .voteType(voteType)
                    .build();
            debateVoteRepository.save(vote);

            if (voteType == DebateVote.VoteType.AGREE) {
                board.increaseAgreeCount();
            } else {
                board.increaseDisagreeCount();
            }
        }

        boardRepository.save(board);
        return new VoteResponseDTO(true, voteType.name());
    }
}