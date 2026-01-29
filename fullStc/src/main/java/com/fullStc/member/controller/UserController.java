package com.fullStc.member.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fullStc.member.dto.CategoryUpdateDTO;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.dto.ProfileUpdateDTO;
import com.fullStc.member.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 사용자 관련 컨트롤러
@Tag(name = "사용자", description = "사용자 정보 조회 및 관심 카테고리 관리 API")
@RestController
@RequestMapping("/api/user")
@Slf4j
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 현재 사용자 정보 조회
    @Operation(summary = "내 정보 조회", description = "현재 로그인한 사용자의 정보를 조회합니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @SecurityRequirement(name = "JWT")
    @GetMapping("/me")
    public ResponseEntity<MemberDTO> getMyInfo(Authentication authentication) {
        log.info("현재 사용자 정보 조회 요청");

        // SecurityContext에서 사용자 정보 가져오기
        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();

        MemberDTO userInfo = userService.getUserInfo(userId);
        return ResponseEntity.ok(userInfo);
    }

    // 관심 카테고리 업데이트
    @Operation(summary = "관심 카테고리 업데이트", description = "사용자의 관심 카테고리를 업데이트합니다. 기존 카테고리는 모두 삭제되고 새로운 카테고리로 교체됩니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "업데이트 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (카테고리 목록이 비어있음)"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @SecurityRequirement(name = "JWT")
    @PutMapping("/categories")
    public ResponseEntity<Void> updateCategories(
            @Validated @RequestBody CategoryUpdateDTO categoryUpdateDTO,
            Authentication authentication) {
        log.info("관심 카테고리 업데이트 요청");

        // SecurityContext에서 사용자 정보 가져오기
        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();

        userService.updateUserCategories(userId, categoryUpdateDTO);
        return ResponseEntity.ok().build();
    }

    // 프로필(닉네임) 업데이트
    @Operation(summary = "프로필 업데이트", description = "현재 로그인한 사용자의 프로필(닉네임 등)을 업데이트합니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "업데이트 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (닉네임 중복/형식 오류)"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @SecurityRequirement(name = "JWT")
    @PutMapping("/profile")
    public ResponseEntity<Void> updateProfile(
            @Validated @RequestBody ProfileUpdateDTO profileUpdateDTO,
            Authentication authentication) {
        log.info("프로필 업데이트 요청");

        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();

        userService.updateProfile(userId, profileUpdateDTO);
        return ResponseEntity.ok().build();
    }

    // 계정 비활성(탈퇴)
    @Operation(summary = "계정 비활성(탈퇴)", description = "현재 로그인한 사용자의 계정을 비활성화합니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "비활성화(탈퇴) 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @SecurityRequirement(name = "JWT")
    @DeleteMapping("/me")
    public ResponseEntity<Void> deactivateMe(Authentication authentication) {
        log.info("계정 비활성(탈퇴) 요청");

        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();

        userService.deactivateUser(userId);
        return ResponseEntity.ok().build();
    }

    // 프로필 이미지 업로드/변경
    @Operation(summary = "프로필 이미지 업로드", description = "현재 로그인한 사용자의 프로필 이미지를 업로드하거나 변경합니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "업로드 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (파일 없음 등)"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @SecurityRequirement(name = "JWT")
    @PostMapping("/profile/image")
    public ResponseEntity<Void> uploadProfileImage(
            @RequestPart("file") MultipartFile file,
            Authentication authentication) {
        log.info("프로필 이미지 업로드 요청");

        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();

        userService.updateProfileImage(userId, file);
        return ResponseEntity.ok().build();
    }

    // 프로필 이미지 삭제
    @Operation(summary = "프로필 이미지 삭제", description = "현재 로그인한 사용자의 프로필 이미지를 삭제합니다. JWT 토큰이 필요합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자")
    })
    @SecurityRequirement(name = "JWT")
    @DeleteMapping("/profile/image")
    public ResponseEntity<Void> deleteProfileImage(Authentication authentication) {
        log.info("프로필 이미지 삭제 요청");

        MemberDTO memberDTO = (MemberDTO) authentication.getPrincipal();
        Long userId = memberDTO.getId();

        userService.deleteProfileImage(userId);
        return ResponseEntity.ok().build();
    }
}
