package com.fullStc.config;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.domain.RefreshToken;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.MemberRepository;
import com.fullStc.member.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 애플리케이션 시작 시 더미 데이터 자동 생성
@Component
@Order(1) // 다른 초기화 작업보다 먼저 실행
@Slf4j
@RequiredArgsConstructor
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(
    name = "app.init.dummy-data",
    havingValue = "true",
    matchIfMissing = true
)
public class DataInitializer implements ApplicationRunner {

    private final MemberRepository memberRepository;
    private final MemberCategoryRepository memberCategoryRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        log.info("=== 더미 데이터 초기화 시작 ===");
        
        // 더미 데이터 생성 여부 확인 (환경 변수 또는 프로파일로 제어 가능)
        String initData = System.getProperty("app.init.dummy-data", "true");
        if (!"true".equalsIgnoreCase(initData)) {
            log.info("더미 데이터 초기화가 비활성화되어 있습니다.");
            return;
        }

        // 10명의 회원 데이터 생성
        String[] emails = new String[10];
        for (int i = 0; i < 10; i++) {
            emails[i] = String.format("test%04d@test.com", i + 1);
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

        int createdCount = 0;
        int skippedCount = 0;

        // 더미 데이터 생성
        for (int i = 0; i < 10; i++) {
            // 기존 회원이 있는지 확인 (중복 방지)
            if (memberRepository.existsByEmail(emails[i])) {
                log.debug("이미 존재하는 이메일: {}, 건너뜀", emails[i]);
                skippedCount++;
                continue;
            }
            
            // 닉네임 중복 확인 (중복 방지)
            if (memberRepository.existsByNickname(nicknames[i])) {
                log.debug("이미 존재하는 닉네임: {}, 건너뜀", nicknames[i]);
                skippedCount++;
                continue;
            }
            
            // 회원 생성
            MemberRole role = (i == 0 || i == 9) ? MemberRole.ADMIN : MemberRole.USER;
            String password = String.format("test%04d@", i + 1);
            
            Member member = Member.builder()
                    .email(emails[i])
                    .password(passwordEncoder.encode(password))
                    .nickname(nicknames[i])
                    .provider(providers[i])
                    .providerId(providers[i].equals("local") ? null : providers[i] + "_" + (i + 1))
                    .enabled(true)
                    .build();
            member.addRole(role);
            
            Member savedMember = memberRepository.save(member);
            createdCount++;
            log.info("회원 생성 완료: email={}, nickname={}, provider={}, role={}", 
                    savedMember.getEmail(), savedMember.getNickname(), savedMember.getProvider(), role);

            // 관심 카테고리 추가 (각 회원마다 1-3개)
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

        // 통계 출력
        List<Member> allMembers = memberRepository.findAll();
        long localCount = allMembers.stream().filter(m -> "local".equals(m.getProvider())).count();
        long socialCount = allMembers.stream().filter(m -> !"local".equals(m.getProvider())).count();
        long adminCount = allMembers.stream()
                .filter(m -> m.getMemberRoleList().contains(MemberRole.ADMIN))
                .count();
        long userCount = allMembers.stream()
                .filter(m -> m.getMemberRoleList().contains(MemberRole.USER))
                .count();

        log.info("=== 더미 데이터 초기화 완료 ===");
        log.info("새로 생성된 회원: {}명", createdCount);
        log.info("건너뛴 회원 (이미 존재): {}명", skippedCount);
        log.info("총 회원 수: {}명", allMembers.size());
        log.info("일반 로그인: {}명", localCount);
        log.info("소셜 로그인: {}명", socialCount);
        log.info("ADMIN 권한: {}명", adminCount);
        log.info("USER 권한: {}명", userCount);
        
        // 로그인 테스트용 정보 출력
        if (createdCount > 0) {
            log.info("=== 로그인 테스트용 계정 정보 ===");
            log.info("이메일: test0001@test.com, 비밀번호: test0001@");
            log.info("이메일: test0002@test.com, 비밀번호: test0002@");
        }
    }
}
