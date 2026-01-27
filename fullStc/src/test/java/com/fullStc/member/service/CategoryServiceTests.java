package com.fullStc.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.dto.CategoryUpdateDTO;
import com.fullStc.member.repository.BaseRepositoryTest;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.TestHelper;

// CategoryService 테스트 클래스
public class CategoryServiceTests extends BaseRepositoryTest {

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private MemberCategoryRepository memberCategoryRepository;

    // 카테고리 목록 조회 성공
    @Test
    public void testGetAllCategories_Success() {
        // when
        List<String> categories = categoryService.getAllCategories();

        // then
        assertThat(categories).isNotNull();
        assertThat(categories).hasSize(6);
        assertThat(categories).containsExactlyInAnyOrder("정치", "경제", "엔터", "IT/과학", "스포츠", "국제");
        log.info("카테고리 목록 조회 성공: categories={}", categories);
    }

    // 사용자 관심 카테고리 조회 성공
    @Test
    public void testGetUserCategories_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("getusercat");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "GetUserCatUser");

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
        List<String> categories = categoryService.getUserCategories(member.getId());

        // then
        assertThat(categories).isNotNull();
        assertThat(categories).hasSize(2);
        assertThat(categories).containsExactlyInAnyOrder("정치", "경제");
        log.info("사용자 관심 카테고리 조회 성공: userId={}, categories={}", member.getId(), categories);
    }

    // 사용자 관심 카테고리 조회 실패 - 존재하지 않는 회원
    @Test
    public void testGetUserCategories_NotFound() {
        // when & then
        assertThatThrownBy(() -> categoryService.getUserCategories(99999L))
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
                .category("정치")
                .build();
        memberCategoryRepository.save(oldCategory);

        // 새로운 카테고리 목록
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("경제", "스포츠", "IT/과학"))
                .build();

        // when
        categoryService.updateUserCategories(member.getId(), updateDTO);

        // then
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());
        assertThat(categories).hasSize(3);
        assertThat(categories).extracting(MemberCategory::getCategory)
                .containsExactlyInAnyOrder("경제", "스포츠", "IT/과학");
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
        memberCategoryRepository.save(MemberCategory.builder().member(member).category("정치").build());
        memberCategoryRepository.save(MemberCategory.builder().member(member).category("경제").build());
        memberCategoryRepository.save(MemberCategory.builder().member(member).category("스포츠").build());

        // 새로운 카테고리 목록 (기존과 다름)
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("IT/과학", "국제"))
                .build();

        // when
        categoryService.updateUserCategories(member.getId(), updateDTO);

        // then
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());
        assertThat(categories).hasSize(2);
        assertThat(categories).extracting(MemberCategory::getCategory)
                .containsExactlyInAnyOrder("IT/과학", "국제");
        log.info("카테고리 교체 성공: 기존 3개 -> 새로운 2개");
    }

    // 관심 카테고리 업데이트 실패 - 존재하지 않는 회원
    @Test
    public void testUpdateUserCategories_NotFound() {
        // given
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("정치"))
                .build();

        // when & then
        assertThatThrownBy(() -> categoryService.updateUserCategories(99999L, updateDTO))
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
        memberCategoryRepository.save(MemberCategory.builder().member(member).category("정치").build());

        // 빈 카테고리 목록
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList())
                .build();

        // when
        categoryService.updateUserCategories(member.getId(), updateDTO);

        // then
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());
        assertThat(categories).isEmpty();
        log.info("카테고리 모두 삭제 성공");
    }

    // 관심 카테고리 업데이트 - 최대 3개 제한 검증
    @Test
    public void testUpdateUserCategories_MaxThreeCategories() {
        // given
        String email = TestHelper.generateUniqueEmail("maxthree");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "MaxThreeUser");

        // 3개 카테고리 업데이트
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("정치", "경제", "엔터"))
                .build();

        // when
        categoryService.updateUserCategories(member.getId(), updateDTO);

        // then
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());
        assertThat(categories).hasSize(3);
        assertThat(categories).extracting(MemberCategory::getCategory)
                .containsExactlyInAnyOrder("정치", "경제", "엔터");
        log.info("최대 3개 카테고리 저장 성공");
    }

    // 관심 카테고리 업데이트 실패 - 3개 초과
    @Test
    public void testUpdateUserCategories_ExceedsMaxLimit() {
        // given
        String email = TestHelper.generateUniqueEmail("exceedmax");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "ExceedMaxUser");

        // 4개 카테고리 (최대 3개 초과)
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("정치", "경제", "엔터", "IT/과학"))
                .build();

        // when & then
        assertThatThrownBy(() -> categoryService.updateUserCategories(member.getId(), updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("최대 3개까지 선택할 수 있습니다");
        log.info("3개 초과 카테고리 검증 성공");
    }

    // 관심 카테고리 업데이트 실패 - 유효하지 않은 카테고리
    @Test
    public void testUpdateUserCategories_InvalidCategory() {
        // given
        String email = TestHelper.generateUniqueEmail("invalidupdate");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "InvalidUpdateUser");

        // 유효하지 않은 카테고리
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("InvalidCategory"))
                .build();

        // when & then
        assertThatThrownBy(() -> categoryService.updateUserCategories(member.getId(), updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 카테고리입니다");
        log.info("유효하지 않은 카테고리 검증 성공");
    }

    // 관심 카테고리 업데이트 - 모든 카테고리 테스트
    @Test
    public void testUpdateUserCategories_AllCategories() {
        // given
        String email = TestHelper.generateUniqueEmail("allcat");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "AllCatUser");

        // 모든 카테고리 중 3개 선택
        CategoryUpdateDTO updateDTO = CategoryUpdateDTO.builder()
                .categories(Arrays.asList("정치", "경제", "엔터", "IT/과학", "스포츠", "국제"))
                .build();

        // when & then - 3개 초과이므로 실패해야 함
        assertThatThrownBy(() -> categoryService.updateUserCategories(member.getId(), updateDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("최대 3개까지 선택할 수 있습니다");
        log.info("모든 카테고리 중 3개 초과 검증 성공");
    }
}
