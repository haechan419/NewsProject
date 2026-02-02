package com.fullStc.member.repository;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.enums.MemberRole;

// 테스트 헬퍼 클래스
public class TestHelper {

    // 기본 회원 생성 (USER 권한)
    public static Member createMember(
            MemberRepository memberRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String nickname) {
        return createMember(memberRepository, passwordEncoder, email, nickname, "local", null, MemberRole.USER);
    }

    // 회원 생성 (권한 지정)
    public static Member createMember(
            MemberRepository memberRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String nickname,
            MemberRole role) {
        return createMember(memberRepository, passwordEncoder, email, nickname, "local", null, role);
    }

    // 회원 생성 (전체 옵션)
    public static Member createMember(
            MemberRepository memberRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String nickname,
            String provider,
            String providerId,
            MemberRole role) {
        // 이메일에서 숫자 추출하여 비밀번호 생성 (예: test0001@test.com -> test0001@)
        String password = generatePasswordFromEmail(email);
        return createMember(memberRepository, passwordEncoder, email, nickname, provider, providerId, role, password);
    }

    // 회원 생성 (전체 옵션 + 비밀번호 지정)
    public static Member createMember(
            MemberRepository memberRepository,
            PasswordEncoder passwordEncoder,
            String email,
            String nickname,
            String provider,
            String providerId,
            MemberRole role,
            String password) {
        Member member = Member.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .nickname(nickname)
                .provider(provider)
                .providerId(providerId)
                .enabled(true)
                .build();
        member.addRole(role);
        return memberRepository.save(member);
    }

    // 고유한 이메일 생성 (타임스탬프 사용)
    public static String generateUniqueEmail(String prefix) {
        return prefix + "_" + System.currentTimeMillis() + "@test.com";
    }

    // 더미 데이터용 이메일 생성 (test0001@test.com 형식)
    public static String generateDummyEmail(int index) {
        return String.format("test%04d@test.com", index);
    }

    // 더미 데이터용 비밀번호 생성 (test0001@ 형식)
    public static String generateDummyPassword(int index) {
        return String.format("test%04d@", index);
    }

    // 이메일에서 비밀번호 추출 (test0001@test.com -> test0001@)
    private static String generatePasswordFromEmail(String email) {
        // test0001@test.com 형식에서 test0001@ 추출
        if (email != null && email.contains("@")) {
            String localPart = email.split("@")[0];
            // 숫자가 포함되어 있으면 그대로 사용, 없으면 기본값 사용
            if (localPart.matches(".*\\d+.*")) {
                return localPart + "@";
            }
        }
        // 기본 비밀번호 (이메일 형식이 예상과 다를 경우)
        return "test1234@";
    }

    // 고유한 닉네임 생성 (타임스탬프 사용)
    public static String generateUniqueNickname(String prefix) {
        return prefix + "_" + System.currentTimeMillis();
    }
}
