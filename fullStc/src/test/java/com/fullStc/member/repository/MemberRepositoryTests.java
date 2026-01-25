package com.fullStc.member.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.enums.MemberRole;

// MemberRepository 테스트 클래스
public class MemberRepositoryTests extends BaseRepositoryTest {

    // 회원 조회 테스트
    @Test
    public void testRead() {
        String email = "user9@aaa.com";
        Member member = memberRepository.getWithRoles(email);

        if (member != null) {
            log.info("회원 정보: {}", member);
            log.info("권한 목록: {}", member.getMemberRoleList());
        } else {
            log.error("회원을 찾을 수 없습니다: {}", email);
        }
    }

    // 이메일로 회원 조회 - 성공
    @Test
    public void testFindByEmail_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("test");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "TestUser");

        // when
        Optional<Member> found = memberRepository.findByEmail(email);

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo(email);
        log.info("조회된 회원: {}", found.get());
    }

    // 이메일로 회원 조회 - 실패
    @Test
    public void testFindByEmail_NotFound() {
        // when
        Optional<Member> found = memberRepository.findByEmail("notfound@example.com");

        // then
        assertThat(found).isEmpty();
        log.info("존재하지 않는 이메일 조회 결과: {}", found);
    }

    // getWithRoles로 회원 조회 (권한 포함)
    @Test
    public void testGetWithRoles() {
        // given
        String email = TestHelper.generateUniqueEmail("admin");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "AdminUser", MemberRole.USER);
        member.addRole(MemberRole.ADMIN);
        memberRepository.save(member);

        // when
        Member found = memberRepository.getWithRoles(email);

        // then
        assertThat(found).isNotNull();
        assertThat(found.getEmail()).isEqualTo(email);
        assertThat(found.getMemberRoleList()).isNotEmpty();
        assertThat(found.getMemberRoleList()).contains(MemberRole.USER, MemberRole.ADMIN);
        log.info("회원 정보: {}", found);
        log.info("권한 목록: {}", found.getMemberRoleList());
    }

    // 이메일 존재 여부 확인
    @Test
    public void testExistsByEmail() {
        // given
        String existingEmail = TestHelper.generateUniqueEmail("exists");
        TestHelper.createMember(memberRepository, passwordEncoder, existingEmail, "ExistsUser");
        String notExistingEmail = "notfound@example.com";

        // when
        boolean exists1 = memberRepository.existsByEmail(existingEmail);
        boolean exists2 = memberRepository.existsByEmail(notExistingEmail);

        // then
        assertThat(exists1).isTrue();
        assertThat(exists2).isFalse();
        log.info("이메일 존재 여부 - {}: {}, {}: {}", existingEmail, exists1, notExistingEmail, exists2);
    }

    // 닉네임 존재 여부 확인
    @Test
    public void testExistsByNickname() {
        // given
        String existingNickname = TestHelper.generateUniqueNickname("ExistingNick");
        TestHelper.createMember(memberRepository, passwordEncoder, TestHelper.generateUniqueEmail("nick"), existingNickname);
        String notExistingNickname = "NOTEXIST";

        // when
        boolean exists1 = memberRepository.existsByNickname(existingNickname);
        boolean exists2 = memberRepository.existsByNickname(notExistingNickname);

        // then
        assertThat(exists1).isTrue();
        assertThat(exists2).isFalse();
        log.info("닉네임 존재 여부 - {}: {}, {}: {}", existingNickname, exists1, notExistingNickname, exists2);
    }

    // 소셜 로그인 회원 조회
    @Test
    public void testFindByProviderAndProviderId() {
        // given
        String email = TestHelper.generateUniqueEmail("social");
        Member socialMember = TestHelper.createMember(
                memberRepository, passwordEncoder, email, "SocialUser", "kakao", "kakao_12345", MemberRole.USER);

        // when
        Optional<Member> found = memberRepository.findByProviderAndProviderId("kakao", "kakao_12345");

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getProvider()).isEqualTo("kakao");
        assertThat(found.get().getProviderId()).isEqualTo("kakao_12345");
        log.info("소셜 로그인 회원: {}", found.get());
    }

    // 회원 저장 및 조회
    @Test
    public void testSaveAndFind() {
        // given
        String email = TestHelper.generateUniqueEmail("new");
        Member newMember = TestHelper.createMember(memberRepository, passwordEncoder, email, "NewUser");

        // when
        Optional<Member> found = memberRepository.findById(newMember.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo(email);
        assertThat(found.get().getNickname()).isEqualTo("NewUser");
        log.info("저장된 회원: {}", found.get());
    }
}
