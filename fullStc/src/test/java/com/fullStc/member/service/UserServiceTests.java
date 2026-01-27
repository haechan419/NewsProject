package com.fullStc.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.repository.BaseRepositoryTest;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.TestHelper;

// UserService 테스트 클래스
public class UserServiceTests extends BaseRepositoryTest {

    @Autowired
    private UserService userService;

    @Autowired
    private MemberCategoryRepository memberCategoryRepository;

    // 사용자 정보 조회 성공
    @Test
    public void testGetUserInfo_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("userinfo");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "UserInfoTest");

        // 관심 카테고리 추가
        MemberCategory category1 = MemberCategory.builder()
                .member(member)
                .category("정치")
                .build();
        MemberCategory category2 = MemberCategory.builder()
                .member(member)
                .category("경제")
                .build();
        memberCategoryRepository.save(category1);
        memberCategoryRepository.save(category2);

        // when
        MemberDTO memberDTO = userService.getUserInfo(member.getId());

        // then
        assertThat(memberDTO).isNotNull();
        assertThat(memberDTO.getId()).isEqualTo(member.getId());
        assertThat(memberDTO.getEmail()).isEqualTo(email);
        assertThat(memberDTO.getNickname()).isEqualTo("UserInfoTest");
        assertThat(memberDTO.getProvider()).isEqualTo("local");
        assertThat(memberDTO.getRoleNames()).contains(MemberRole.USER.name());
        assertThat(memberDTO.getCategories()).hasSize(2);
        assertThat(memberDTO.getCategories()).contains("정치", "경제");
        log.info("사용자 정보 조회 성공: userId={}, categories={}", memberDTO.getId(), memberDTO.getCategories());
    }

    // 사용자 정보 조회 실패 - 존재하지 않는 회원
    @Test
    public void testGetUserInfo_NotFound() {
        // when & then
        assertThatThrownBy(() -> userService.getUserInfo(99999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("존재하지 않는 회원입니다");
        log.info("존재하지 않는 회원 검증 성공");
    }
}
