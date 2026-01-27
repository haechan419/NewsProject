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
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // 실제 DB 사용
@Import(TestConfig.class)
@Slf4j
class DataInitializerTest extends BaseRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private MemberCategoryRepository memberCategoryRepository;

    @Test
    @DisplayName("더미 데이터 300개 생성")
    void createDummyData() {

        int TOTAL = 300;

        String[] providers = {"local", "kakao", "naver", "google"};
        // 카테고리 목록 (정치, 경제, 엔터, IT/과학, 스포츠, 국제)
        String[] categories = {
                "정치", "경제", "엔터", "IT/과학", "스포츠", "국제"
        };

        for (int i = 1; i <= TOTAL; i++) {

            String email = String.format("test%04d@test.com", i);
            String nickname = "User" + i;

            if (memberRepository.existsByEmail(email)) {
                continue;
            }

            MemberRole role = (i % 100 == 0) ? MemberRole.ADMIN : MemberRole.USER;
            String provider = providers[i % providers.length];
            String password = "test" + i + "@";

            Member member = TestHelper.createMember(
                    memberRepository,
                    passwordEncoder,
                    email,
                    nickname,
                    provider,
                    provider.equals("local") ? null : provider + "_" + i,
                    role,
                    password
            );

            // 관심 카테고리 (1~3개)
            int categoryCount = (i % 3) + 1;

            for (int j = 0; j < categoryCount; j++) {
                memberCategoryRepository.save(
                        MemberCategory.builder()
                                .member(member)
                                .category(categories[(i + j) % categories.length])
                                .build()
                );
            }

            // RefreshToken (3명 중 1명)
            if (i % 3 == 0) {
                refreshTokenRepository.save(
                        RefreshToken.builder()
                                .member(member)
                                .token("refresh-token-" + i)
                                .expiryDate(LocalDateTime.now().plusDays(7))
                                .build()
                );
            }

            log.info("생성 완료: {}", email);
        }

        log.info("더미 회원 300명 생성 완료");
    }
}
