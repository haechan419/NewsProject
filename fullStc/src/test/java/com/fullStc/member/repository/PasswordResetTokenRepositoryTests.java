package com.fullStc.member.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.PasswordResetToken;

// PasswordResetTokenRepository 테스트 클래스
public class PasswordResetTokenRepositoryTests extends BaseRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    // 토큰 값으로 PasswordResetToken 조회
    @Test
    public void testFindByToken() {
        // given
        String email = TestHelper.generateUniqueEmail("tokenTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "TokenTestUser");

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .member(member)
                .token("test-reset-token-12345")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        passwordResetTokenRepository.save(resetToken);

        // when
        Optional<PasswordResetToken> found = passwordResetTokenRepository.findByToken("test-reset-token-12345");

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getToken()).isEqualTo("test-reset-token-12345");
        assertThat(found.get().getMember().getId()).isEqualTo(member.getId());
        assertThat(found.get().isUsed()).isFalse();
        log.info("조회된 PasswordResetToken: {}", found.get());
    }

    // 회원 ID로 PasswordResetToken 목록 조회
    @Test
    public void testFindByMemberId() {
        // given
        String email = TestHelper.generateUniqueEmail("multiToken");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "MultiTokenUser");

        PasswordResetToken token1 = PasswordResetToken.builder()
                .member(member)
                .token("reset-token-1")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        PasswordResetToken token2 = PasswordResetToken.builder()
                .member(member)
                .token("reset-token-2")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        passwordResetTokenRepository.save(token1);
        passwordResetTokenRepository.save(token2);

        // when
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findByMemberId(member.getId());

        // then
        assertThat(tokens).hasSize(2);
        assertThat(tokens).extracting(PasswordResetToken::getToken)
                .contains("reset-token-1", "reset-token-2");
        log.info("회원의 PasswordResetToken 목록: {}", tokens);
    }

    // 회원 ID로 모든 PasswordResetToken 삭제
    @Test
    public void testDeleteByMemberId() {
        // given
        String email = TestHelper.generateUniqueEmail("deleteTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "DeleteTestUser");

        PasswordResetToken token1 = PasswordResetToken.builder()
                .member(member)
                .token("delete-token-1")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        PasswordResetToken token2 = PasswordResetToken.builder()
                .member(member)
                .token("delete-token-2")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        passwordResetTokenRepository.save(token1);
        passwordResetTokenRepository.save(token2);

        // when
        passwordResetTokenRepository.deleteByMemberId(member.getId());

        // then
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findByMemberId(member.getId());
        assertThat(tokens).isEmpty();
        log.info("회원의 모든 PasswordResetToken 삭제 완료");
    }

    // 토큰 만료 여부 확인
    @Test
    public void testIsExpired() {
        // given
        String email = TestHelper.generateUniqueEmail("expiredTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "ExpiredTestUser");

        // 만료된 토큰
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .member(member)
                .token("expired-reset-token")
                .expiryDate(LocalDateTime.now().minusHours(1)) // 만료됨
                .used(false)
                .build();
        passwordResetTokenRepository.save(expiredToken);

        // 유효한 토큰
        PasswordResetToken validToken = PasswordResetToken.builder()
                .member(member)
                .token("valid-reset-token")
                .expiryDate(LocalDateTime.now().plusHours(1)) // 유효함
                .used(false)
                .build();
        passwordResetTokenRepository.save(validToken);

        // when
        PasswordResetToken foundExpired = passwordResetTokenRepository.findByToken("expired-reset-token").orElse(null);
        PasswordResetToken foundValid = passwordResetTokenRepository.findByToken("valid-reset-token").orElse(null);

        // then
        assertThat(foundExpired).isNotNull();
        assertThat(foundValid).isNotNull();
        assertThat(foundExpired.isExpired()).isTrue();
        assertThat(foundValid.isExpired()).isFalse();
        log.info("만료된 토큰: {}, 유효한 토큰: {}", foundExpired.isExpired(), foundValid.isExpired());
    }

    // 토큰 사용 여부 확인
    @Test
    public void testUsed() {
        // given
        String email = TestHelper.generateUniqueEmail("usedTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "UsedTestUser");

        PasswordResetToken unusedToken = PasswordResetToken.builder()
                .member(member)
                .token("unused-token")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        passwordResetTokenRepository.save(unusedToken);

        PasswordResetToken usedToken = PasswordResetToken.builder()
                .member(member)
                .token("used-token")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(true)
                .build();
        passwordResetTokenRepository.save(usedToken);

        // when
        PasswordResetToken foundUnused = passwordResetTokenRepository.findByToken("unused-token").orElse(null);
        PasswordResetToken foundUsed = passwordResetTokenRepository.findByToken("used-token").orElse(null);

        // then
        assertThat(foundUnused).isNotNull();
        assertThat(foundUsed).isNotNull();
        assertThat(foundUnused.isUsed()).isFalse();
        assertThat(foundUsed.isUsed()).isTrue();
        log.info("미사용 토큰: {}, 사용된 토큰: {}", foundUnused.isUsed(), foundUsed.isUsed());
    }

    // 토큰 사용 처리 메서드 테스트
    @Test
    public void testMarkAsUsed() {
        // given
        String email = TestHelper.generateUniqueEmail("markUsedTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "MarkUsedTestUser");

        PasswordResetToken token = PasswordResetToken.builder()
                .member(member)
                .token("mark-used-token")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
        passwordResetTokenRepository.save(token);

        // when
        PasswordResetToken found = passwordResetTokenRepository.findByToken("mark-used-token").orElse(null);
        assertThat(found).isNotNull();
        found.markAsUsed();
        passwordResetTokenRepository.save(found);

        // then
        PasswordResetToken updated = passwordResetTokenRepository.findByToken("mark-used-token").orElse(null);
        assertThat(updated).isNotNull();
        assertThat(updated.isUsed()).isTrue();
        log.info("토큰 사용 처리 완료: {}", updated.isUsed());
    }
}
