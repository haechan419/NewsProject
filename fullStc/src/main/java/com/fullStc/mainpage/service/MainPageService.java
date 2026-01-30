package com.fullStc.mainpage.service;

import com.fullStc.mainpage.domain.MainPageNews;
import com.fullStc.mainpage.dto.MainPageNewsDTO;
import com.fullStc.mainpage.dto.MainPageResponseDTO;
import com.fullStc.mainpage.repository.MainPageNewsRepository;
import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 메인페이지 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainPageService {

    private final MainPageNewsRepository mainPageNewsRepository;
    private final MemberRepository memberRepository;
    private final MemberCategoryRepository memberCategoryRepository;

    /**
     * 메인페이지 데이터 조회
     */
    public MainPageResponseDTO getMainPageData(Long userId) {
        // 1. 카테고리별 인기 뉴스 조회 (각 카테고리 1개씩)
        List<MainPageNewsDTO> popularNewsByCategory = getPopularNewsByCategory();

        // 2. 사용자 관심 카테고리 조회
        List<String> userCategories = getUserCategories(userId);

        // 3. 선택된 카테고리의 인기 뉴스 (영상 추가 예정)
        MainPageNewsDTO topNewsForSelectedCategory = null;
        if (!userCategories.isEmpty()) {
            topNewsForSelectedCategory = getTopNewsForCategory(userCategories.get(0));
        }

        // 4. 사용자 관심 카테고리별 뉴스 목록
        List<MainPageNewsDTO> newsByUserCategories = getNewsByUserCategories(userId, 10);

        return MainPageResponseDTO.builder()
                .popularNewsByCategory(popularNewsByCategory)
                .userCategories(userCategories)
                .topNewsForSelectedCategory(topNewsForSelectedCategory)
                .newsByUserCategories(newsByUserCategories)
                .build();
    }

    /**
     * 카테고리별 인기 뉴스 조회 (각 카테고리 1개씩)
     */
    private List<MainPageNewsDTO> getPopularNewsByCategory() {
        List<String> allCategories = mainPageNewsRepository.findAllDistinctCategories();

        // 카테고리가 없으면 빈 리스트 반환
        if (allCategories.isEmpty()) {
            return List.of();
        }

        Pageable pageable = PageRequest.of(0, 1);

        return allCategories.stream()
                .map(category -> {
                    List<MainPageNews> newsList = mainPageNewsRepository.findTopByCategoryOrderByViewCount(category,
                            pageable);
                    if (!newsList.isEmpty()) {
                        return convertToDTO(newsList.get(0));
                    }
                    return null;
                })
                .filter(news -> news != null)
                .collect(Collectors.toList());
    }

    /**
     * 사용자 관심 카테고리 조회
     */
    private List<String> getUserCategories(Long userId) {
        if (userId == null) {
            return List.of();
        }

        Member member = memberRepository.findById(userId)
                .orElse(null);

        if (member == null) {
            return List.of();
        }

        List<MemberCategory> memberCategories = memberCategoryRepository.findByMember(member);
        return memberCategories.stream()
                .map(MemberCategory::getCategory)
                .collect(Collectors.toList());
    }

    /**
     * 특정 카테고리의 인기 뉴스 조회
     */
    private MainPageNewsDTO getTopNewsForCategory(String category) {
        Pageable pageable = PageRequest.of(0, 1);
        List<MainPageNews> newsList = mainPageNewsRepository.findTopByCategoryOrderByViewCount(category, pageable);

        if (!newsList.isEmpty()) {
            return convertToDTO(newsList.get(0));
        }
        return null;
    }

    /**
     * 사용자 관심 카테고리별 뉴스 목록 조회
     */
    private List<MainPageNewsDTO> getNewsByUserCategories(Long userId, int limit) {
        List<String> userCategories = getUserCategories(userId);

        if (userCategories.isEmpty()) {
            return List.of();
        }

        Pageable pageable = PageRequest.of(0, limit);
        List<MainPageNews> newsList = mainPageNewsRepository.findByCategoriesOrderByViewCount(userCategories, pageable);

        return newsList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * MainPageNews 엔티티를 MainPageNewsDTO로 변환
     */
    private MainPageNewsDTO convertToDTO(MainPageNews news) {
        return MainPageNewsDTO.builder()
                .id(news.getId())
                .newsId(news.getNewsId())
                .title(news.getTitle())
                .summary(news.getSummary())
                .category(news.getCategory())
                .url(news.getUrl())
                .sourceName(news.getSourceName())
                .publishedAt(news.getPublishedAt())
                .viewCount(news.getViewCount() != null ? news.getViewCount() : 0L)
                .build();
    }
}
