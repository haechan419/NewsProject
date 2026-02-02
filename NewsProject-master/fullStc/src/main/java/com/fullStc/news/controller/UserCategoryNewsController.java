package com.fullStc.news.controller;

import com.fullStc.member.dto.MemberDTO;
import com.fullStc.news.dto.BriefingResponseDTO;
import com.fullStc.news.service.UserCategoryNewsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 사용자 관심 카테고리별 뉴스 클러스터 조회 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/news/user-categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserCategoryNewsController {

    private final UserCategoryNewsService userCategoryNewsService;
    private final com.fullStc.member.service.CategoryService categoryService;

    /**
     * 현재 로그인한 사용자의 관심 카테고리별 뉴스 클러스터 조회
     * 
     * @param authentication 인증 정보
     * @param limit          조회할 최대 개수 (기본값: 20)
     * @return BriefingResponseDTO 리스트
     */
    @GetMapping
    public ResponseEntity<List<BriefingResponseDTO>> getNewsByUserCategories(
            Authentication authentication,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            // 현재 로그인한 사용자 ID 가져오기
            Long userId = getCurrentUserId(authentication);

            if (userId == null) {
                log.warn("인증되지 않은 사용자 요청");
                return ResponseEntity.ok(List.of());
            }

            // 사용자 관심 카테고리 조회
            List<String> userCategories = categoryService.getUserCategories(userId);

            // 관심 카테고리별 뉴스 조회 (비어있어도 Service에서 Fallback 처리됨)
            List<BriefingResponseDTO> news = userCategoryNewsService.getNewsByUserCategories(
                    userCategories,
                    limit);

            return ResponseEntity.ok(news);
        } catch (Exception e) {
            log.error("사용자 관심 카테고리별 뉴스 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 특정 카테고리로 뉴스 클러스터 조회 (GET 방식)
     * 
     * @param category 카테고리 (예: "it", "politics")
     * @param limit    조회할 최대 개수 (기본값: 20)
     * @return BriefingResponseDTO 리스트
     */
    @GetMapping("/by-category")
    public ResponseEntity<List<BriefingResponseDTO>> getNewsByCategory(
            @RequestParam String category,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            log.info("카테고리별 뉴스 조회 요청: category={}, limit={}", category, limit);

            if (category == null || category.isEmpty()) {
                log.warn("카테고리가 비어있습니다.");
                return ResponseEntity.ok(List.of());
            }

            // 카테고리를 소문자로 정규화
            String normalizedCategory = category.toLowerCase().trim();
            log.info("정규화된 카테고리: {}", normalizedCategory);

            List<BriefingResponseDTO> news = userCategoryNewsService.getNewsByUserCategories(
                    List.of(normalizedCategory),
                    limit);

            log.info("조회된 뉴스 개수: {}", news.size());
            return ResponseEntity.ok(news);
        } catch (Exception e) {
            log.error("카테고리별 뉴스 조회 실패: category={}", category, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 현재 로그인한 사용자 ID 가져오기
     */
    private Long getCurrentUserId(Authentication authentication) {
        try {
            if (authentication != null && authentication.isAuthenticated()) {
                Object principal = authentication.getPrincipal();

                // MemberDTO 타입인 경우
                if (principal instanceof MemberDTO) {
                    MemberDTO memberDTO = (MemberDTO) principal;
                    return memberDTO.getId();
                }

                // Map 타입인 경우 (OAuth2 등)
                if (principal instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> principalMap = (Map<String, Object>) principal;
                    Object idObj = principalMap.get("id");
                    if (idObj instanceof Number) {
                        return ((Number) idObj).longValue();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("사용자 ID 조회 실패", e);
        }
        return null;
    }
}
