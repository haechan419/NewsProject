package com.fullStc.member.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fullStc.member.dto.CategoryUpdateDTO;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.service.CategoryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 카테고리 관련 컨트롤러
@Tag(name = "카테고리", description = "카테고리 목록 조회 및 관심 카테고리 관리 API")
@RestController
@RequestMapping("/api/category")
@Slf4j
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // 카테고리 목록 조회
    @Operation(summary = "카테고리 목록 조회", description = "선택 가능한 모든 카테고리 목록을 조회합니다. 인증이 필요 없습니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공")
    })
    @GetMapping("/list")
    public ResponseEntity<List<String>> getCategories() {
        log.info("카테고리 목록 조회 요청");
        List<String> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categories);
    }

    // 현재 사용자의 관심 카테고리 조회
    @Operation(summary = "내 관심 카테고리 조회", description = "현재 로그인한 사용자의 관심 카테고리를 조회합니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @SecurityRequirement(name = "JWT")
    @GetMapping("/my")
    public ResponseEntity<List<String>> getMyCategories(Authentication authentication) {
        log.info("현재 사용자 관심 카테고리 조회 요청");
        
        // SecurityContext에서 사용자 정보 가져오기
        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();
        
        List<String> categories = categoryService.getUserCategories(userId);
        return ResponseEntity.ok(categories);
    }

    // 관심 카테고리 업데이트
    @Operation(summary = "관심 카테고리 업데이트", description = "사용자의 관심 카테고리를 업데이트합니다. 기존 카테고리는 모두 삭제되고 새로운 카테고리로 교체됩니다. 최대 3개까지 선택할 수 있습니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "업데이트 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (카테고리 목록이 비어있거나 3개 초과)"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @SecurityRequirement(name = "JWT")
    @PutMapping("/my")
    public ResponseEntity<Void> updateMyCategories(
            @Validated @RequestBody CategoryUpdateDTO categoryUpdateDTO,
            Authentication authentication) {
        log.info("관심 카테고리 업데이트 요청");
        
        // SecurityContext에서 사용자 정보 가져오기
        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();
        
        categoryService.updateUserCategories(userId, categoryUpdateDTO);
        return ResponseEntity.ok().build();
    }
}
