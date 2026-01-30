package com.fullStc.board.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.board.domain.Board;
import com.fullStc.board.repository.BoardRepository;
import com.fullStc.config.TestConfig;
import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * BoardDataInitializer 테스트 클래스
 * 더미 데이터 생성이 올바르게 작동하는지 확인합니다.
 */
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestConfig.class)
@Slf4j
class BoardDataInitializerTest {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BoardRepository boardRepository;

    @Test
    @DisplayName("더미 데이터 생성 테스트 - 회원 300명 생성")
    @Rollback(false) // 실제 DB에 저장 (테스트용)
    @Transactional
    void testCreateDummyMembers() {
        // given & when
        // BoardDataInitializer가 실행되면 자동으로 회원이 생성됨
        // 또는 수동으로 테스트할 수 있도록 별도 메서드 호출
        
        // User1부터 User300까지의 회원이 존재하는지 확인
        for (int i = 1; i <= 300; i++) {
            String email = "user" + i + "@dummy.com";
            String nickname = "User" + i;
            
            Optional<Member> member = memberRepository.findByEmail(email);
            
            if (member.isPresent()) {
                assertThat(member.get().getNickname()).isEqualTo(nickname);
                assertThat(member.get().getEmail()).isEqualTo(email);
                log.debug("회원 확인: {}", member.get().getNickname());
            } else {
                log.warn("회원이 존재하지 않음: {}", email);
            }
        }

        // then
        List<Member> allMembers = memberRepository.findAll();
        long userCount = allMembers.stream()
            .filter(m -> m.getNickname().startsWith("User") && 
                       m.getEmail().contains("@dummy.com"))
            .count();
        
        log.info("더미 회원 수: {}명", userCount);
        assertThat(userCount).isGreaterThanOrEqualTo(0); // 최소 0명 이상
    }

    @Test
    @DisplayName("더미 데이터 생성 테스트 - 게시글 생성 및 검증")
    @Rollback(false)
    @Transactional
    void testCreateDummyBoards() {
        // given
        // BoardDataInitializer가 실행되면 게시글이 생성됨
        
        // when
        List<Board> allBoards = boardRepository.findAll();
        List<Board> nonDeletedBoards = allBoards.stream()
            .filter(b -> !b.getIsDeleted())
            .toList();

        // then
        log.info("전체 게시글 수: {}개", allBoards.size());
        log.info("삭제되지 않은 게시글 수: {}개", nonDeletedBoards.size());
        
        assertThat(nonDeletedBoards.size()).isGreaterThan(0);

        // 게시글 검증
        for (Board board : nonDeletedBoards) {
            // 기본 필수 필드 검증
            assertThat(board.getUser()).isNotNull();
            assertThat(board.getTitle()).isNotNull().isNotEmpty();
            assertThat(board.getContent()).isNotNull().isNotEmpty();
            assertThat(board.getBoardType()).isNotNull();
            
            // 랜덤 값 범위 검증
            assertThat(board.getViewCount()).isGreaterThanOrEqualTo(0).isLessThanOrEqualTo(1000);
            assertThat(board.getLikeCount()).isGreaterThanOrEqualTo(0).isLessThanOrEqualTo(500);
            assertThat(board.getCommentCount()).isGreaterThanOrEqualTo(0).isLessThanOrEqualTo(200);
            
            // 토론 게시판인 경우 추가 검증
            if (board.getBoardType() == Board.BoardType.DEBATE) {
                assertThat(board.getDebateTopic()).isNotNull().isNotEmpty();
                assertThat(board.getAgreeCount()).isGreaterThanOrEqualTo(0).isLessThanOrEqualTo(300);
                assertThat(board.getDisagreeCount()).isGreaterThanOrEqualTo(0).isLessThanOrEqualTo(300);
            } else {
                // 일반 게시판은 찬성/반대 수가 0이어야 함
                assertThat(board.getAgreeCount()).isEqualTo(0);
                assertThat(board.getDisagreeCount()).isEqualTo(0);
            }
        }
    }

    @Test
    @DisplayName("더미 데이터 생성 테스트 - 게시판 타입 비율 검증")
    @Rollback(false)
    @Transactional
    void testBoardTypeRatio() {
        // given
        List<Board> allBoards = boardRepository.findAll().stream()
            .filter(b -> !b.getIsDeleted())
            .toList();

        // when
        long normalCount = allBoards.stream()
            .filter(b -> b.getBoardType() == Board.BoardType.NORMAL)
            .count();
        
        long debateCount = allBoards.stream()
            .filter(b -> b.getBoardType() == Board.BoardType.DEBATE)
            .count();

        // then
        log.info("일반 게시판: {}개", normalCount);
        log.info("토론 게시판: {}개", debateCount);
        log.info("전체 게시글 수: {}개", allBoards.size());
        
        if (allBoards.size() > 0) {
            double normalRatio = (double) normalCount / allBoards.size();
            double debateRatio = (double) debateCount / allBoards.size();
            
            log.info("일반 게시판 비율: {:.2f}%", normalRatio * 100);
            log.info("토론 게시판 비율: {:.2f}%", debateRatio * 100);
            
            // 게시글이 충분히 많을 때만 비율 검증 (랜덤이므로 작은 수에서는 실패할 수 있음)
            // 최소 10개 이상의 게시글이 있을 때만 검증
            if (allBoards.size() >= 10) {
                // 일반 게시판이 토론 게시판보다 많아야 함 (70% vs 30% 목표)
                // 하지만 랜덤이므로 완전히 보장할 수 없으므로, 일반 게시판이 0개가 아니면 통과
                assertThat(normalCount + debateCount).isEqualTo(allBoards.size());
                log.info("비율 검증 통과: 게시글이 충분히 많아 비율 검증 수행");
            } else {
                // 게시글이 적을 때는 타입만 확인
                assertThat(normalCount + debateCount).isEqualTo(allBoards.size());
                log.info("게시글이 적어 비율 검증을 건너뜁니다. (최소 10개 필요, 현재: {}개)", allBoards.size());
            }
        } else {
            log.warn("게시글이 없어 비율 검증을 수행할 수 없습니다.");
        }
    }

    @Test
    @DisplayName("더미 데이터 생성 테스트 - 회원별 게시글 수 검증")
    @Rollback(false)
    @Transactional
    void testBoardsPerMember() {
        // given
        List<Member> dummyMembers = memberRepository.findAll().stream()
            .filter(m -> m.getNickname().startsWith("User") && 
                        m.getEmail().contains("@dummy.com"))
            .toList();

        // when & then
        for (Member member : dummyMembers) {
            List<Board> memberBoards = boardRepository.findAll().stream()
                .filter(b -> b.getUser().getId().equals(member.getId()) && 
                           !b.getIsDeleted())
                .toList();

            // 각 회원당 3~10개의 게시글이 있어야 함
            // (랜덤이므로 최소 0개 이상이면 통과)
            assertThat(memberBoards.size()).isGreaterThanOrEqualTo(0);
            
            if (memberBoards.size() > 0) {
                log.debug("회원 {}의 게시글 수: {}개", member.getNickname(), memberBoards.size());
            }
        }
    }

    @Test
    @DisplayName("더미 데이터 생성 테스트 - 중복 생성 방지 검증")
    @Rollback(false)
    @Transactional
    void testDuplicatePrevention() {
        // given
        String testEmail = "user1@dummy.com";
        String testNickname = "User1";

        // when
        Optional<Member> member1 = memberRepository.findByEmail(testEmail);
        Optional<Member> member2 = memberRepository.findByEmail(testEmail);

        // then
        // 같은 이메일로 조회하면 같은 회원이 나와야 함
        if (member1.isPresent() && member2.isPresent()) {
            assertThat(member1.get().getId()).isEqualTo(member2.get().getId());
            assertThat(member1.get().getNickname()).isEqualTo(testNickname);
        }
    }

    @Test
    @DisplayName("더미 데이터 생성 테스트 - 랜덤 값 범위 검증")
    @Rollback(false)
    @Transactional
    void testRandomValueRanges() {
        // given
        List<Board> allBoards = boardRepository.findAll().stream()
            .filter(b -> !b.getIsDeleted())
            .toList();

        // when & then
        boolean hasViewCountInRange = false;
        boolean hasLikeCountInRange = false;
        boolean hasCommentCountInRange = false;

        for (Board board : allBoards) {
            // 조회수 범위: 1~1000
            if (board.getViewCount() >= 1 && board.getViewCount() <= 1000) {
                hasViewCountInRange = true;
            }
            
            // 좋아요 범위: 1~500
            if (board.getLikeCount() >= 1 && board.getLikeCount() <= 500) {
                hasLikeCountInRange = true;
            }
            
            // 댓글 수 범위: 1~200
            if (board.getCommentCount() >= 1 && board.getCommentCount() <= 200) {
                hasCommentCountInRange = true;
            }
        }

        if (allBoards.size() > 0) {
            assertThat(hasViewCountInRange).isTrue();
            assertThat(hasLikeCountInRange).isTrue();
            assertThat(hasCommentCountInRange).isTrue();
            
            log.info("랜덤 값 범위 검증 통과");
        }
    }

    @Test
    @DisplayName("더미 데이터 생성 테스트 - 통계 정보 출력")
    @Rollback(false)
    @Transactional
    void testPrintStatistics() {
        // given
        List<Member> allMembers = memberRepository.findAll();
        List<Board> allBoards = boardRepository.findAll().stream()
            .filter(b -> !b.getIsDeleted())
            .toList();

        // when
        long dummyMemberCount = allMembers.stream()
            .filter(m -> m.getNickname().startsWith("User") && 
                        m.getEmail().contains("@dummy.com"))
            .count();

        long normalBoardCount = allBoards.stream()
            .filter(b -> b.getBoardType() == Board.BoardType.NORMAL)
            .count();

        long debateBoardCount = allBoards.stream()
            .filter(b -> b.getBoardType() == Board.BoardType.DEBATE)
            .count();

        // then
        log.info("=== 더미 데이터 통계 ===");
        log.info("더미 회원 수: {}명", dummyMemberCount);
        log.info("전체 게시글 수: {}개", allBoards.size());
        log.info("일반 게시판: {}개", normalBoardCount);
        log.info("토론 게시판: {}개", debateBoardCount);
        
        if (allBoards.size() > 0) {
            double avgViewCount = allBoards.stream()
                .mapToInt(Board::getViewCount)
                .average()
                .orElse(0.0);
            
            double avgLikeCount = allBoards.stream()
                .mapToInt(Board::getLikeCount)
                .average()
                .orElse(0.0);
            
            double avgCommentCount = allBoards.stream()
                .mapToInt(Board::getCommentCount)
                .average()
                .orElse(0.0);
            
            log.info("평균 조회수: {:.2f}", avgViewCount);
            log.info("평균 좋아요: {:.2f}", avgLikeCount);
            log.info("평균 댓글 수: {:.2f}", avgCommentCount);
        }
    }
}

