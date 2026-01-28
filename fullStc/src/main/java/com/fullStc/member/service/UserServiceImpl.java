package com.fullStc.member.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.dto.CategoryUpdateDTO;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 사용자 관련 서비스 구현
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final MemberRepository memberRepository;
    private final MemberCategoryRepository memberCategoryRepository;

    // 사용자 정보 조회
    @Override
    @Transactional(readOnly = true)
    public MemberDTO getUserInfo(Long userId) {
        log.info("사용자 정보 조회: userId={}", userId);

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        // 권한을 문자열 리스트로 변환
        List<String> roleNames = member.getMemberRoleList().stream()
                .map(MemberRole::name)
                .collect(Collectors.toList());

        // 관심 카테고리 조회
        List<String> categories = memberCategoryRepository.findByMemberId(userId).stream()
                .map(MemberCategory::getCategory)
                .collect(Collectors.toList());

        MemberDTO memberDTO = MemberDTO.builder()
                .id(member.getId())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .provider(member.getProvider())
                .enabled(member.isEnabled())
                .roleNames(roleNames)
                .categories(categories)
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();

        log.info("사용자 정보 조회 완료: userId={}", userId);
        return memberDTO;
    }

    // 관심 카테고리 업데이트
    @Override
    public void updateUserCategories(Long userId, CategoryUpdateDTO categoryUpdateDTO) {
        log.info("관심 카테고리 업데이트: userId={}, categories={}", userId, categoryUpdateDTO.getCategories());

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        // 기존 카테고리 삭제
        memberCategoryRepository.deleteByMemberId(userId);

        // 새로운 카테고리 추가
        for (String category : categoryUpdateDTO.getCategories()) {
            MemberCategory memberCategory = MemberCategory.builder()
                    .member(member)
                    .category(category)
                    .build();
            memberCategoryRepository.save(memberCategory);
        }

        log.info("관심 카테고리 업데이트 완료: userId={}, categories={}", userId, categoryUpdateDTO.getCategories());
    }
}
