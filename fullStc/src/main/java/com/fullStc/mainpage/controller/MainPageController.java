package com.fullStc.mainpage.controller;

import com.fullStc.mainpage.dto.MainPageEconomicDataDTO;
import com.fullStc.mainpage.dto.MainPageResponseDTO;
import com.fullStc.mainpage.service.MainPageEconomicDataService;
import com.fullStc.mainpage.service.MainPageService;
import com.fullStc.member.dto.MemberDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 메인페이지 컨트롤러
 */
@RestController
@RequestMapping("/api/mainpage")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class MainPageController {

    private final MainPageService mainPageService;
    private final MainPageEconomicDataService mainPageEconomicDataService;

    /**
     * 메인페이지 데이터 조회
     */
    @GetMapping
    public ResponseEntity<MainPageResponseDTO> getMainPageData() {
        try {
            // 현재 로그인한 사용자 ID 가져오기
            Long userId = getCurrentUserId();
            
            MainPageResponseDTO response = mainPageService.getMainPageData(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("메인페이지 데이터 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 경제 데이터 조회
     */
    @GetMapping("/economic-data")
    public ResponseEntity<MainPageEconomicDataDTO> getEconomicData() {
        try {
            MainPageEconomicDataDTO data = mainPageEconomicDataService.getEconomicData();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            log.error("경제 데이터 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 현재 로그인한 사용자 ID 가져오기
     */
    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                Object principal = authentication.getPrincipal();

                // MemberDTO 타입인 경우 (JwtCheckFilter에서 설정)
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
        return null; // 비로그인 사용자는 null 반환
    }
}
