package com.fullStc.support.controller;

import com.fullStc.support.dto.InquiryAdminRequest;
import com.fullStc.support.dto.InquiryCreateRequest;
import com.fullStc.support.dto.InquiryResponse;
import com.fullStc.support.service.InquiryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 문의 티켓 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/inquiry")
@RequiredArgsConstructor
@Tag(name = "Inquiry", description = "문의 티켓 API")
public class InquiryController {

    private final InquiryService inquiryService;

    /**
     * 문의 티켓 생성
     */
    @Operation(summary = "문의 생성", description = "새 문의 티켓을 생성합니다.")
    @PostMapping
    public ResponseEntity<Map<String, Object>> createInquiry(
            @Valid @RequestBody InquiryCreateRequest request) {
        Long userId = getCurrentUserId();
        log.info("문의 생성 요청 - userId: {}, title: {}", userId, request.getTitle());

        InquiryResponse inquiry = inquiryService.createInquiry(userId, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", inquiry);

        return ResponseEntity.ok(response);
    }

    /**
     * 내 문의 목록 조회
     */
    @Operation(summary = "내 문의 목록", description = "내가 작성한 문의 목록을 조회합니다.")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMyInquiries() {
        Long userId = getCurrentUserId();
        log.info("내 문의 목록 조회 - userId: {}", userId);

        List<InquiryResponse> inquiries = inquiryService.getMyInquiries(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", inquiries);

        return ResponseEntity.ok(response);
    }

    /**
     * 문의 상세 조회
     */
    @Operation(summary = "문의 상세 조회", description = "문의 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getInquiryById(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        log.info("문의 상세 조회 - userId: {}, inquiryId: {}", userId, id);

        InquiryResponse inquiry = inquiryService.getInquiryById(userId, id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", inquiry);

        return ResponseEntity.ok(response);
    }

    // ===== 관리자 API =====

    /**
     * 전체 문의 목록 조회 (관리자)
     */
    @Operation(summary = "전체 문의 목록 (관리자)", description = "모든 문의 목록을 조회합니다. (관리자 전용)")
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllInquiries() {
        log.info("전체 문의 목록 조회 (관리자)");

        List<InquiryResponse> inquiries = inquiryService.getAllInquiries();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", inquiries);

        return ResponseEntity.ok(response);
    }

    /**
     * 문의 상세 조회 (관리자)
     */
    @Operation(summary = "문의 상세 조회 (관리자)", description = "문의 상세 정보를 조회합니다. (관리자 전용)")
    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getInquiryByIdForAdmin(@PathVariable Long id) {
        log.info("문의 상세 조회 (관리자) - inquiryId: {}", id);

        InquiryResponse inquiry = inquiryService.getInquiryByIdForAdmin(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", inquiry);

        return ResponseEntity.ok(response);
    }

    /**
     * 문의 상태/답변 업데이트 (관리자)
     */
    @Operation(summary = "문의 업데이트 (관리자)", description = "문의 상태를 변경하거나 답변을 작성합니다. (관리자 전용)")
    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateInquiry(
            @PathVariable Long id,
            @RequestBody InquiryAdminRequest request) {
        log.info("문의 업데이트 (관리자) - inquiryId: {}", id);

        InquiryResponse inquiry = inquiryService.updateInquiry(id, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", inquiry);

        return ResponseEntity.ok(response);
    }

    /**
     * 현재 로그인한 사용자 ID 조회
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> principal = (Map<String, Object>) authentication.getPrincipal();
            Object idObj = principal.get("id");
            if (idObj instanceof Number) {
                return ((Number) idObj).longValue();
            }
        }
        throw new RuntimeException("인증 정보를 찾을 수 없습니다.");
    }
}
