package com.fullStc.member.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.RefreshToken;

// RefreshTokenRepository 테스트 클래스
public class RefreshTokenRepositoryTests extends BaseRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private RefreshTokenRepository refreshTokenRepository;

    // 토큰 값으로 RefreshToken 조회
    @Test
    public void testFindByToken() {
        // given
        String email = TestHelper.generateUniqueEmail("tokenTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "TokenTestUser");

        RefreshToken refreshToken = RefreshToken.builder()
                .member(member)
                .token("test-refresh-token-12345")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(refreshToken);

        // when
        Optional<RefreshToken> found = refreshTokenRepository.findByToken("test-refresh-token-12345");

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo("test-refresh-token-12345");
        assertThat(found.get().getMember().getId()).isEqualTo(member.getId());
        log.info("조회된 RefreshToken: {}", found.get());
    }

    // 회원 ID로 RefreshToken 목록 조회
    @Test
    public void testFindByMemberId() {
        // given
        String email = TestHelper.generateUniqueEmail("multiToken");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "MultiTokenUser");

        RefreshToken token1 = RefreshToken.builder()
                .member(member)
                .token("token-1")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        RefreshToken token2 = RefreshToken.builder()
                .member(member)
                .token("token-2")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(token1);
        refreshTokenRepository.save(token2);

        // when
        List<RefreshToken> tokens = refreshTokenRepository.findByMemberId(member.getId());

        // then
        assertThat(tokens).hasSize(2);
        assertThat(tokens).extracting(RefreshToken::getToken)
                .contains("token-1", "token-2");
        log.info("회원의 RefreshToken 목록: {}", tokens);
    }

    // 회원 ID로 모든 RefreshToken 삭제
    @Test
    public void testDeleteByMemberId() {
        // given
        String email = TestHelper.generateUniqueEmail("deleteTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "DeleteTestUser");

        RefreshToken token1 = RefreshToken.builder()
                .member(member)
                .token("delete-token-1")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        RefreshToken token2 = RefreshToken.builder()
                .member(member)
                .token("delete-token-2")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(token1);
        refreshTokenRepository.save(token2);

        // when
        refreshTokenRepository.deleteByMemberId(member.getId());

        // then
        List<RefreshToken> tokens = refreshTokenRepository.findByMemberId(member.getId());
        assertThat(tokens).isEmpty();
        log.info("회원의 모든 RefreshToken 삭제 완료");
    }

    // 회원으로 RefreshToken 조회
    @Test
    public void testFindByMember() {
        // given
        String email = TestHelper.generateUniqueEmail("findByMember");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "FindByMemberTest");

        RefreshToken token = RefreshToken.builder()
                .member(member)
                .token("member-token")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(token);

        // when
        List<RefreshToken> tokens = refreshTokenRepository.findByMember(member);

        // then
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getToken()).isEqualTo("member-token");
        log.info("회원으로 조회된 RefreshToken: {}", tokens);
    }

    // 토큰 만료 여부 확인
    @Test
    public void testIsExpired() {
        // given
        String email = TestHelper.generateUniqueEmail("expiredTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "ExpiredTestUser");

        // 만료된 토큰
        RefreshToken expiredToken = RefreshToken.builder()
                .member(member)
                .token("expired-token")
                .expiryDate(LocalDateTime.now().minusDays(1)) // 만료됨
                .build();
        refreshTokenRepository.save(expiredToken);

        // 유효한 토큰
        RefreshToken validToken = RefreshToken.builder()
                .member(member)
                .token("valid-token")
                .expiryDate(LocalDateTime.now().plusDays(7)) // 유효함
                .build();
        refreshTokenRepository.save(validToken);

        // when
        RefreshToken foundExpired = refreshTokenRepository.findByToken("expired-token").orElse(null);
        RefreshToken foundValid = refreshTokenRepository.findByToken("valid-token").orElse(null);

        // then
        assertThat(foundExpired).isNotNull();
        assertThat(foundValid).isNotNull();
        assertThat(foundExpired.isExpired()).isTrue();
        assertThat(foundValid.isExpired()).isFalse();
        log.info("만료된 토큰: {}, 유효한 토큰: {}", foundExpired.isExpired(), foundValid.isExpired());
    }
}
