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
import com.fullStc.member.dto.CategoryUpdateDTO;
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
                .category("Entertainment")
                .build();
        MemberCategory category2 = MemberCategory.builder()
                .member(member)
                .category("Sports")
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
        assertThat(memberDTO.getCategories()).contains("Entertainment", "Sports");
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

    // 관심 카테고리 업데이트 성공
    @Test
    public void testUpdateUserCategories_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("updatecat");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "UpdateCatUser");

        // 기존 카테고리 추가
        MemberCategory oldCategory = MemberCategory.builder()
                .member(member)
                .category("Entertainment")
                .build();
        memberCategoryRepository.save(oldCategory);

        // 새로운 카테고리 목록
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("Economy", "Sports", "IT/Technology"))
                .build();

        // when
        userService.updateUserCategories(member.getId(), updateDTO);

        // then
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());
        assertThat(categories).hasSize(3);
        assertThat(categories).extracting(MemberCategory::getCategory)
                .containsExactlyInAnyOrder("Economy", "Sports", "IT/Technology");
        log.info("관심 카테고리 업데이트 성공: categories={}", 
                categories.stream().map(MemberCategory::getCategory).toList());
    }

    // 관심 카테고리 업데이트 - 기존 카테고리 삭제 후 새로 추가
    @Test
    public void testUpdateUserCategories_ReplaceExisting() {
        // given
        String email = TestHelper.generateUniqueEmail("replacecat");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "ReplaceCatUser");

        // 기존 카테고리 여러 개 추가
        memberCategoryRepository.save(MemberCategory.builder().member(member).category("Entertainment").build());
        memberCategoryRepository.save(MemberCategory.builder().member(member).category("Economy").build());
        memberCategoryRepository.save(MemberCategory.builder().member(member).category("Sports").build());

        // 새로운 카테고리 목록 (기존과 다름)
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("IT/Technology", "Society/Issues"))
                .build();

        // when
        userService.updateUserCategories(member.getId(), updateDTO);

        // then
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());
        assertThat(categories).hasSize(2);
        assertThat(categories).extracting(MemberCategory::getCategory)
                .containsExactlyInAnyOrder("IT/Technology", "Society/Issues");
        log.info("카테고리 교체 성공: 기존 3개 -> 새로운 2개");
    }

    // 관심 카테고리 업데이트 실패 - 존재하지 않는 회원
    @Test
    public void testUpdateUserCategories_NotFound() {
        // given
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("Entertainment"))
                .build();

        // when & then
        assertThatThrownBy(() -> userService.updateUserCategories(99999L, updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("존재하지 않는 회원입니다");
        log.info("존재하지 않는 회원의 카테고리 업데이트 검증 성공");
    }

    // 관심 카테고리 업데이트 - 빈 카테고리 목록 (모두 삭제)
    @Test
    public void testUpdateUserCategories_EmptyList() {
        // given
        String email = TestHelper.generateUniqueEmail("emptycat");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "EmptyCatUser");

        // 기존 카테고리 추가
        memberCategoryRepository.save(MemberCategory.builder().member(member).category("Entertainment").build());

        // 빈 카테고리 목록
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList())
                .build();

        // when
        userService.updateUserCategories(member.getId(), updateDTO);

        // then
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());
        assertThat(categories).isEmpty();
        log.info("카테고리 모두 삭제 성공");
    }
}
