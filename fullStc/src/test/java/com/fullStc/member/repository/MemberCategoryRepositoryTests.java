package com.fullStc.member.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;

// MemberCategoryRepository 테스트 클래스
public class MemberCategoryRepositoryTests extends BaseRepositoryTest {

    @org.springframework.beans.factory.annotation.Autowired
    private MemberCategoryRepository memberCategoryRepository;

    // 회원 ID로 관심 카테고리 목록 조회
    @Test
    public void testFindByMemberId() {
        // given
        String email = TestHelper.generateUniqueEmail("categoryTest");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "CategoryTestUser");

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
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());

        // then
        assertThat(categories).hasSize(2);
        assertThat(categories).extracting(MemberCategory::getCategory)
                .contains("정치", "경제");
        log.info("회원의 관심 카테고리 목록: {}", categories);
    }

    // 회원으로 관심 카테고리 목록 조회
    @Test
    public void testFindByMember() {
        // given
        String email = TestHelper.generateUniqueEmail("findByMemberCat");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "FindByMemberCat");

        MemberCategory category = MemberCategory.builder()
                .member(member)
                .category("스포츠")
                .build();
        memberCategoryRepository.save(category);

        // when
        List<MemberCategory> categories = memberCategoryRepository.findByMember(member);

        // then
        assertThat(categories).hasSize(1);
        assertThat(categories.get(0).getCategory()).isEqualTo("스포츠");
        log.info("회원으로 조회된 카테고리: {}", categories);
    }

    // 회원 ID로 모든 관심 카테고리 삭제
    @Test
    public void testDeleteByMemberId() {
        // given
        String email = TestHelper.generateUniqueEmail("deleteCategory");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "DeleteCategoryTest");

        MemberCategory category1 = MemberCategory.builder()
                .member(member)
                .category("IT/과학")
                .build();
        MemberCategory category2 = MemberCategory.builder()
                .member(member)
                .category("국제")
                .build();
        memberCategoryRepository.save(category1);
        memberCategoryRepository.save(category2);

        // when
        memberCategoryRepository.deleteByMemberId(member.getId());

        // then
        List<MemberCategory> categories = memberCategoryRepository.findByMemberId(member.getId());
        assertThat(categories).isEmpty();
        log.info("회원의 모든 관심 카테고리 삭제 완료");
    }

    // 회원 ID와 카테고리명으로 조회
    @Test
    public void testFindByMemberIdAndCategory() {
        // given
        String email = TestHelper.generateUniqueEmail("findByCategory");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "FindByCategoryTest");

        MemberCategory category = MemberCategory.builder()
                .member(member)
                .category("엔터")
                .build();
        memberCategoryRepository.save(category);

        // when
        List<MemberCategory> found = memberCategoryRepository.findByMemberIdAndCategory(
                member.getId(), "엔터");

        // then
        assertThat(found).hasSize(1);
        assertThat(found.get(0).getCategory()).isEqualTo("엔터");
        log.info("회원 ID와 카테고리명으로 조회된 결과: {}", found);
    }
}
