package com.fullStc.member.service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.domain.enums.NewsCategory;
import com.fullStc.member.dto.CategoryUpdateDTO;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 카테고리 관련 서비스 구현
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final MemberRepository memberRepository;
    private final MemberCategoryRepository memberCategoryRepository;

    // 카테고리 목록 조회
    @Override
    @Transactional(readOnly = true)
    public List<String> getAllCategories() {
        log.info("카테고리 목록 조회");
        return Arrays.asList(NewsCategory.getAllDisplayNames());
    }

    // 사용자 관심 카테고리 조회
    @Override
    @Transactional(readOnly = true)
    public List<String> getUserCategories(Long userId) {
        log.info("사용자 관심 카테고리 조회: userId={}", userId);

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        List<String> categories = memberCategoryRepository.findByMemberId(userId).stream()
                .map(MemberCategory::getCategory)
                .collect(Collectors.toList());

        log.info("사용자 관심 카테고리 조회 완료: userId={}, categories={}", userId, categories);
        return categories;
    }

    // 사용자 관심 카테고리 업데이트
    @Override
    public void updateUserCategories(Long userId, CategoryUpdateDTO categoryUpdateDTO) {
        log.info("관심 카테고리 업데이트: userId={}, categories={}", userId, categoryUpdateDTO.getCategories());

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        // 카테고리 유효성 검증
        if (categoryUpdateDTO.getCategories() != null && !categoryUpdateDTO.getCategories().isEmpty()) {
            List<String> validCategories = Arrays.asList(NewsCategory.getAllDisplayNames());
            for (String category : categoryUpdateDTO.getCategories()) {
                if (!validCategories.contains(category)) {
                    throw new IllegalArgumentException("유효하지 않은 카테고리입니다: " + category);
                }
            }
        }

        // 카테고리 개수 검증 (최대 3개)
        if (categoryUpdateDTO.getCategories() != null && categoryUpdateDTO.getCategories().size() > 3) {
            throw new IllegalArgumentException("관심 카테고리는 최대 3개까지 선택할 수 있습니다");
        }

        // 기존 카테고리 삭제
        memberCategoryRepository.deleteByMemberId(userId);

        // 새로운 카테고리 추가 (최대 3개까지만 저장)
        if (categoryUpdateDTO.getCategories() != null && !categoryUpdateDTO.getCategories().isEmpty()) {
            List<String> categoriesToSave = categoryUpdateDTO.getCategories().stream()
                    .limit(3)
                    .filter(category -> category != null && !category.trim().isEmpty())
                    .map(String::trim)
                    .collect(Collectors.toList());
            
            for (String category : categoriesToSave) {
                MemberCategory memberCategory = MemberCategory.builder()
                        .member(member)
                        .category(category)
                        .build();
                memberCategoryRepository.save(memberCategory);
            }
        }

        log.info("관심 카테고리 업데이트 완료: userId={}, categories={}", userId, categoryUpdateDTO.getCategories());
    }
}
