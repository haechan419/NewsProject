package com.fullStc.board.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Random;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.board.domain.Board;
import com.fullStc.board.domain.BoardComment;
import com.fullStc.board.domain.BoardLike;
import com.fullStc.board.domain.BoardView;
import com.fullStc.board.repository.BoardCommentRepository;
import com.fullStc.board.repository.BoardLikeRepository;
import com.fullStc.board.repository.BoardRepository;
import com.fullStc.board.repository.BoardViewRepository;
import com.fullStc.config.TestConfig;
import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * 게시판 더미 데이터 생성 테스트
 * Board, BoardComment, BoardFile, BoardLike, BoardView 테이블에 더미 데이터를 생성합니다.
 */
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestConfig.class)
@Slf4j
class BoardDummyDataTest {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private BoardRepository boardRepository;

    @Autowired
    private BoardCommentRepository boardCommentRepository;

    @Autowired
    private BoardLikeRepository boardLikeRepository;

    @Autowired
    private BoardViewRepository boardViewRepository;

    private final Random random = new Random();

    // 더미 제목 목록 (뉴스 기사 스타일)
    private final String[] titles = {
        "2026 군사력 랭킹 나왔다 'NO 핵' 한국 세계 5위",
        "숨진 주인 옆에서 4일 인도가 울었다",
        "마트주차장에 '시민 어벤져스' 119보다 빨랐다!",
        "처인구 신규 사업 발표, 지역 경제 활성화 기대",
        "기흥구 문화 행사 개최, 주민 참여 열기",
        "수지구 도로 공사 완료, 교통 흐름 개선",
        "처인구 환경 정책 발표, 탄소 중립 목표",
        "기흥구 주민 참여 프로그램 확대",
        "수지구 복지 서비스 확대, 취약계층 지원",
        "처인구 교통 개선 계획 수립",
        "기흥구 스마트시티 구축 추진",
        "수지구 주거 환경 개선 사업",
        "처인구 청년 일자리 창출 프로젝트",
        "기흥구 문화재 보존 사업 진행",
        "수지구 안전 도시 조성 계획",
        "처인구 디지털 전환 가속화",
        "기흥구 지역 상권 활성화 방안",
        "수지구 교육 인프라 확충",
        "처인구 건강 도시 프로젝트",
        "기흥구 스마트 관광 플랫폼 구축"
    };

    // 더미 내용 목록 (뉴스 기사 본문 스타일)
    private final String[] contents = {
        "핵무기 없는 한국이 3년 연속 세계 군사력 5위를 기록했다. 전문가들은 한국의 첨단 무기 체계와 훈련된 군인들이 높은 평가를 받았다고 분석했다.",
        "눈보라에 갇혀 숨진 주인을 나흘 동안 곁에서 지킨 반려견의 이야기가 전해지며 많은 이들의 가슴을 뭉클하게 했다. 구조대원들은 반려견의 충성심에 감동했다고 전했다.",
        "마트 주차장에서 발생한 사고 현장에 시민들이 우르르 달려와 구조에 나서 119보다 빨랐다는 평가가 나왔다. 시민들의 자발적인 참여가 큰 도움이 되었다.",
        "처인구가 지역 경제 활성화를 위한 신규 사업을 발표했다. 이번 사업은 지역 상권 활성화와 일자리 창출에 기여할 것으로 기대된다.",
        "기흥구가 주민 참여형 문화 행사를 개최하며 지역 문화 발전에 기여하고 있다. 많은 주민들이 행사에 참여하며 뜨거운 반응을 보이고 있다.",
        "수지구의 주요 도로 공사가 완료되며 교통 흐름이 크게 개선되었다. 주민들은 교통 체증 해소에 만족감을 표했다.",
        "처인구가 탄소 중립 목표를 포함한 환경 정책을 발표했다. 친환경 에너지 전환과 녹색 도시 조성을 위한 계획이 포함되어 있다.",
        "기흥구가 주민 참여 프로그램을 확대하여 지역 주민들의 의견을 적극 반영하겠다고 밝혔다. 다양한 프로그램이 운영될 예정이다.",
        "수지구가 취약계층을 위한 복지 서비스를 확대한다고 발표했다. 생활 지원과 의료 서비스 개선에 중점을 둘 예정이다.",
        "처인구가 교통 개선 계획을 수립하여 대중교통 확충과 도로 정비를 추진한다고 밝혔다. 주민들의 교통 편의성이 향상될 것으로 예상된다.",
        "기흥구가 스마트시티 구축을 추진하며 디지털 인프라 확충에 나선다. 첨단 기술을 활용한 도시 서비스 제공이 목표다.",
        "수지구가 주거 환경 개선 사업을 통해 주민들의 삶의 질 향상을 도모한다. 주거 시설 현대화와 환경 개선에 집중할 예정이다.",
        "처인구가 청년 일자리 창출 프로젝트를 통해 지역 청년들의 고용 기회를 확대한다. 다양한 산업 분야에서 일자리가 창출될 예정이다.",
        "기흥구가 문화재 보존 사업을 진행하며 지역의 역사적 가치를 지켜나간다. 전문가들과 협력하여 체계적인 보존 작업이 이루어질 예정이다.",
        "수지구가 안전 도시 조성을 위한 종합 계획을 수립했다. 범죄 예방과 재난 대응 체계 강화에 중점을 둘 예정이다.",
        "처인구가 디지털 전환을 가속화하여 행정 서비스의 효율성을 높인다. 온라인 서비스 확대와 스마트 행정 구현이 목표다.",
        "기흥구가 지역 상권 활성화를 위한 다양한 방안을 모색하고 있다. 소상공인 지원과 상권 재생 프로젝트가 추진될 예정이다.",
        "수지구가 교육 인프라 확충을 통해 교육 환경을 개선한다. 학교 시설 현대화와 교육 프로그램 다양화에 집중할 예정이다.",
        "처인구가 건강 도시 프로젝트를 통해 주민들의 건강 증진에 기여한다. 건강 관리 프로그램과 의료 서비스 접근성 향상이 목표다.",
        "기흥구가 스마트 관광 플랫폼 구축을 통해 지역 관광 산업을 활성화한다. 디지털 기술을 활용한 관광 서비스 제공이 계획되어 있다."
    };

    // 더미 댓글 내용 목록 (뉴스 기사 댓글 스타일)
    private final String[] commentContents = {
        "좋은 기사 감사합니다!",
        "정말 중요한 정보네요.",
        "이런 소식 들으니 안심이 됩니다.",
        "더 자세한 내용이 궁금합니다.",
        "다음 기사도 기대하겠습니다.",
        "공감합니다!",
        "좋은 정보 공유해주셔서 감사합니다.",
        "관련 정책이 더 필요할 것 같습니다.",
        "정말 도움이 되는 기사였어요.",
        "주변에 공유하겠습니다!",
        "이런 뉴스가 더 필요합니다.",
        "좋은 방향으로 나아가고 있네요.",
        "실제로 체감되는 변화가 있었으면 좋겠습니다.",
        "지역 발전에 도움이 될 것 같습니다.",
        "주민들의 의견도 들어봤으면 좋겠어요."
    };

    // 토론 주제 목록 (뉴스/정치/사회 이슈)
    private final String[] debateTopics = {
        "한국의 군사력 강화가 필요한가요?",
        "지역 경제 활성화를 위한 최우선 과제는 무엇일까요?",
        "디지털 전환이 지역 발전에 필수적일까요?",
        "주민 참여형 행정이 효과적일까요?",
        "환경 정책이 지역 경제에 부정적 영향을 미칠까요?",
        "복지 서비스 확대가 재정 부담만 가중시킬까요?",
        "스마트시티 구축이 프라이버시 침해로 이어질까요?",
        "청년 일자리 창출 정책이 실제로 효과가 있을까요?",
        "문화재 보존보다 개발이 우선되어야 할까요?",
        "안전 도시 조성을 위한 예산 투입이 과도한가요?",
        "상권 활성화 정책이 대형 마트에만 유리할까요?",
        "교육 인프라 확충이 교육 격차를 해소할 수 있을까요?",
        "건강 도시 프로젝트가 실질적 효과를 낼 수 있을까요?",
        "스마트 관광 플랫폼이 지역 관광에 도움이 될까요?",
        "주거 환경 개선 사업이 주민 부담을 증가시킬까요?"
    };


    @Test
    @DisplayName("게시판 전체 더미 데이터 생성 테스트")
    @Rollback(false) // 실제 DB에 저장
    @Transactional
    void createAllBoardDummyData() {
        log.info("=== 게시판 더미 데이터 생성 시작 ===");

        // 1. 회원 조회 (User1 ~ User300 중 일부만 사용)
        List<Member> members = new ArrayList<>();
        for (int i = 1; i <= 300; i++) {
            String nickname = "User" + i;
            Optional<Member> memberOpt = memberRepository.findByNickname(nickname);
            if (memberOpt.isPresent()) {
                members.add(memberOpt.get());
            }
        }

        log.info("회원 준비 완료: {}명", members.size());

        if (members.isEmpty()) {
            log.error("회원이 없어 더미 데이터를 생성할 수 없습니다!");
            return;
        }

        // 2. 게시글 생성 (총 200개)
        List<Board> boards = new ArrayList<>();
        int targetBoards = 200;
        int totalBoards = 0;
        int normalBoards = 0;
        int debateBoards = 0;

        while (totalBoards < targetBoards) {
            // 랜덤 회원 선택
            Member member = members.get(random.nextInt(members.size()));
            
            // 게시판 타입 랜덤 선택 (70% 일반, 30% 토론)
            Board.BoardType boardType = random.nextDouble() < 0.7 
                ? Board.BoardType.NORMAL 
                : Board.BoardType.DEBATE;

            // 제목과 내용 랜덤 선택
            String title = titles[random.nextInt(titles.length)];
            String content = contents[random.nextInt(contents.length)];

            // 랜덤 값 생성
            int viewCount = random.nextInt(1000) + 1; // 1~1000
            int likeCount = random.nextInt(500) + 1; // 1~500
            int commentCount = random.nextInt(200) + 1; // 1~200

            Board.BoardBuilder boardBuilder = Board.builder()
                .user(member)
                .boardType(boardType)
                .title(title)
                .content(content)
                .viewCount(viewCount)
                .likeCount(likeCount)
                .commentCount(commentCount)
                .isDeleted(false);

            // 토론 게시판인 경우 토론 주제와 찬성/반대 수 추가
            if (boardType == Board.BoardType.DEBATE) {
                boardBuilder
                    .debateTopic(debateTopics[random.nextInt(debateTopics.length)])
                    .agreeCount(random.nextInt(300) + 1) // 1~300
                    .disagreeCount(random.nextInt(300) + 1); // 1~300
            } else {
                boardBuilder
                    .agreeCount(0)
                    .disagreeCount(0);
            }

            Board savedBoard = boardRepository.save(boardBuilder.build());
            boards.add(savedBoard);

            totalBoards++;
            if (boardType == Board.BoardType.NORMAL) {
                normalBoards++;
            } else {
                debateBoards++;
            }

            // 진행 상황 로그
            if (totalBoards % 50 == 0) {
                log.info("게시글 생성 진행 중... {}개 생성됨", totalBoards);
            }
        }

        log.info("게시글 생성 완료: {}개 (일반: {}개, 토론: {}개)", totalBoards, normalBoards, debateBoards);

        // 3. 댓글 생성 (총 500개)
        int targetComments = 500;
        int totalComments = 0;
        
        while (totalComments < targetComments) {
            // 랜덤 게시글 선택
            Board board = boards.get(random.nextInt(boards.size()));
            
            // 랜덤 회원 선택
            Member commentUser = members.get(random.nextInt(members.size()));
            
            String commentContent = commentContents[random.nextInt(commentContents.length)];
            
            BoardComment comment = BoardComment.builder()
                .board(board)
                .user(commentUser)
                .content(commentContent)
                .parentComment(null) // 최상위 댓글
                .likeCount(random.nextInt(50)) // 0~49
                .isDeleted(false)
                .build();
            
            boardCommentRepository.save(comment);
            totalComments++;
            
            // 진행 상황 로그
            if (totalComments % 100 == 0) {
                log.info("댓글 생성 진행 중... {}개 생성됨", totalComments);
            }
        }

        log.info("댓글 생성 완료: {}개", totalComments);

        // 4. 좋아요 생성
        int totalLikes = 0;
        List<Member> likedMembers = new ArrayList<>();
        
        for (Board board : boards) {
            // 각 게시글당 0~30개의 좋아요 생성
            int likeCount = random.nextInt(31); // 0~30개
            likedMembers.clear();
            
            for (int i = 0; i < likeCount; i++) {
                // 랜덤 회원 선택
                Member likeUser = members.get(random.nextInt(members.size()));
                
                // 이미 좋아요를 누른 회원인지 확인
                if (likedMembers.contains(likeUser)) {
                    continue;
                }
                
                // 이미 존재하는 좋아요인지 확인
                if (boardLikeRepository.existsByBoardAndUser(board, likeUser)) {
                    continue;
                }
                
                BoardLike boardLike = BoardLike.builder()
                    .board(board)
                    .user(likeUser)
                    .build();

                boardLikeRepository.save(boardLike);
                likedMembers.add(likeUser);
                totalLikes++;
            }
        }

        log.info("좋아요 생성 완료: {}개", totalLikes);

        // 5. 조회 기록 생성
        int totalViews = 0;
        LocalDate today = LocalDate.now();
        List<Member> viewedMembers = new ArrayList<>();
        
        for (Board board : boards) {
            // 각 게시글당 0~50개의 조회 기록 생성
            int viewCount = random.nextInt(51); // 0~50개
            viewedMembers.clear();
            
            for (int i = 0; i < viewCount; i++) {
                // 랜덤 회원 선택
                Member viewUser = members.get(random.nextInt(members.size()));
                
                // 이미 조회한 회원인지 확인
                if (viewedMembers.contains(viewUser)) {
                    continue;
                }
                
                // 이미 존재하는 조회 기록인지 확인
                if (boardViewRepository.existsByBoardAndUserAndViewDate(board, viewUser, today)) {
                    continue;
                }
                
                BoardView boardView = BoardView.builder()
                    .board(board)
                    .user(viewUser)
                    .viewDate(today)
                    .build();

                boardViewRepository.save(boardView);
                viewedMembers.add(viewUser);
                totalViews++;
            }
        }

        log.info("조회 기록 생성 완료: {}개", totalViews);

        // 최종 통계
        log.info("=== 게시판 더미 데이터 생성 완료 ===");
        log.info("생성된 게시글 수: {}개", totalBoards);
        log.info("생성된 댓글 수: {}개", totalComments);
        log.info("생성된 좋아요 수: {}개", totalLikes);
        log.info("생성된 조회 기록 수: {}개", totalViews);

        // 검증
        assertThat(boardRepository.count()).isGreaterThanOrEqualTo(totalBoards);
        assertThat(boardCommentRepository.count()).isGreaterThanOrEqualTo(totalComments);
        assertThat(boardLikeRepository.count()).isGreaterThanOrEqualTo(totalLikes);
        assertThat(boardViewRepository.count()).isGreaterThanOrEqualTo(totalViews);
    }
}

