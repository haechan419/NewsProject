package com.fullStc.member.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fullStc.config.TestConfig;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.domain.RefreshToken;
import com.fullStc.member.domain.enums.MemberRole;

import lombok.extern.slf4j.Slf4j;

// 더미 데이터 생성 및 테스트 (실제 DB에 저장됨)
@org.springframework.boot.test.context.SpringBootTest
@org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase(replace = org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.NONE) // 실제 DB 사용
@org.springframework.context.annotation.Import(com.fullStc.config.TestConfig.class)
@lombok.extern.slf4j.Slf4j
class DataInitializerTest extends BaseRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @org.springframework.beans.factory.annotation.Autowired
    private MemberCategoryRepository memberCategoryRepository;

    @Test
    @DisplayName("더미 데이터 10개 생성 및 검증")
    void createDummyData() {
        // given - 10명의 회원 생성 (TestHelper를 사용하여 일관된 형식으로 생성)
        String[] emails = new String[10];
        for (int i = 0; i < 10; i++) {
            emails[i] = TestHelper.generateDummyEmail(i + 1); // test0001@test.com, test0002@test.com, ...
        }

        String[] nicknames = {
            "User1", "User2", "User3", "User4", "User5",
            "User6", "User7", "User8", "User9", "User10"
        };

        String[] providers = {"local", "local", "kakao", "naver", "google",
                             "local", "kakao", "local", "naver", "local"};

        String[] categories = {
            "Entertainment", "Economy", "Sports", "IT/Technology", "Society/Issues"
        };

        // 생성된 회원 인덱스 추적 (검증용)
        java.util.Set<Integer> createdIndices = new java.util.HashSet<>();

        // when - 더미 데이터 생성
        for (int i = 0; i < 10; i++) {
            // 기존 회원이 있는지 확인 (중복 방지)
            if (memberRepository.existsByEmail(emails[i])) {
                log.warn("이미 존재하는 이메일: {}, 건너뜀", emails[i]);
                continue;
            }
            
            // 닉네임 중복 확인 (중복 방지)
            if (memberRepository.existsByNickname(nicknames[i])) {
                log.warn("이미 존재하는 닉네임: {}, 건너뜀", nicknames[i]);
                continue;
            }
            
            // 회원 생성
            MemberRole role = (i == 0 || i == 9) ? MemberRole.ADMIN : MemberRole.USER;
            String password = TestHelper.generateDummyPassword(i + 1); // test0001@, test0002@, ...
            Member savedMember = TestHelper.createMember(
                    memberRepository,
                    passwordEncoder,
                    emails[i],
                    nicknames[i],
                    providers[i],
                    providers[i].equals("local") ? null : providers[i] + "_" + (i + 1),
                    role,
                    password);
            log.info("회원 생성 완료: email={}, nickname={}", savedMember.getEmail(), savedMember.getNickname());
            createdIndices.add(i); // 생성된 인덱스 추가

            // 관심 카테고리 추가 (각 회원마다 1-3개 랜덤하게)
            int categoryCount = (i % 3) + 1;
            for (int j = 0; j < categoryCount; j++) {
                MemberCategory category = MemberCategory.builder()
                        .member(savedMember)
                        .category(categories[(i + j) % categories.length])
                        .build();
                memberCategoryRepository.save(category);
            }

            // RefreshToken 추가 (일부 회원만)
            if (i % 2 == 0) {
                RefreshToken refreshToken = RefreshToken.builder()
                        .member(savedMember)
                        .token("refresh-token-" + (i + 1))
                        .expiryDate(LocalDateTime.now().plusDays(7))
                        .build();
                refreshTokenRepository.save(refreshToken);
            }
        }

        // then - 데이터 검증 (실제 DB에 저장된 데이터 확인)
        List<Member> allMembers = memberRepository.findAll();
        // 기존 데이터가 있을 수 있으므로 최소 10개 이상인지 확인
        assertThat(allMembers.size()).isGreaterThanOrEqualTo(10);

        // 각 회원 검증 (이번 테스트에서 새로 생성된 회원만 검증)
        for (int i : createdIndices) {
            Member member = memberRepository.findByEmail(emails[i]).orElse(null);
            assertThat(member).isNotNull();
            assertThat(member.getNickname()).isEqualTo(nicknames[i]);
            assertThat(member.getProvider()).isEqualTo(providers[i]);
            assertThat(member.isEnabled()).isTrue();

            // 권한 검증
            if (i == 0 || i == 9) {
                assertThat(member.getMemberRoleList()).contains(MemberRole.ADMIN);
            } else {
                assertThat(member.getMemberRoleList()).contains(MemberRole.USER);
            }

            // 관심 카테고리 검증
            List<MemberCategory> memberCategories = memberCategoryRepository.findByMemberId(member.getId());
            int expectedCategoryCount = (i % 3) + 1;
            assertThat(memberCategories).hasSize(expectedCategoryCount);
        }

        // RefreshToken 검증 (실제 생성된 회원 중 짝수 인덱스만큼 생성됨)
        List<RefreshToken> allTokens = refreshTokenRepository.findAll();
        // 실제 생성된 회원 중 짝수 인덱스(i % 2 == 0)인 회원 수만큼 RefreshToken 생성
        long expectedTokenCount = createdIndices.stream()
            .filter(i -> i % 2 == 0)
            .count();
        // 기존 토큰이 있을 수 있으므로 최소 expectedTokenCount 이상인지 확인
        assertThat(allTokens.size()).isGreaterThanOrEqualTo((int)expectedTokenCount);
        
        // 이번 테스트에서 생성된 회원들에 대해 RefreshToken이 올바르게 생성되었는지 확인
        for (int i : createdIndices) {
            if (i % 2 == 0) {
                // 짝수 인덱스 회원은 RefreshToken이 있어야 함
                Member member = memberRepository.findByEmail(emails[i]).orElse(null);
                if (member != null) {
                    List<RefreshToken> memberTokens = refreshTokenRepository.findByMemberId(member.getId());
                    assertThat(memberTokens).isNotEmpty();
                }
            }
        }

        // 통계 출력 (이미 조회한 회원들의 정보 사용)
        int localCount = 0;
        int socialCount = 0;
        int adminCount = 0;
        int userCount = 0;
        
        log.info("=== 더미 데이터 생성 완료 (실제 DB에 저장됨) ===");
        log.info("총 회원 수: {}", allMembers.size());
        
        // 생성된 회원 정보 출력 및 통계 계산
        for (int i = 0; i < 10; i++) {
            Member member = memberRepository.findByEmail(emails[i]).orElse(null);
            if (member != null) {
                // 통계 계산
                if ("local".equals(member.getProvider())) {
                    localCount++;
                } else {
                    socialCount++;
                }
                if (member.getMemberRoleList().contains(MemberRole.ADMIN)) {
                    adminCount++;
                }
                if (member.getMemberRoleList().contains(MemberRole.USER)) {
                    userCount++;
                }
                
                log.info("생성된 회원: email={}, nickname={}, provider={}, roles={}", 
                    member.getEmail(), member.getNickname(), member.getProvider(), member.getMemberRoleList());
            }
        }
        
        log.info("일반 로그인: {}", localCount);
        log.info("소셜 로그인: {}", socialCount);
        log.info("ADMIN 권한: {}", adminCount);
        log.info("USER 권한: {}", userCount);
        log.info("RefreshToken 수: {}", allTokens.size());
    }
}
