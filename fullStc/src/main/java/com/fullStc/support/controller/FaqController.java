package com.fullStc.support.controller;

import com.fullStc.support.domain.FaqCategory;
import com.fullStc.support.dto.FaqRequest;
import com.fullStc.support.dto.FaqResponse;
import com.fullStc.support.service.FaqService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FAQ 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/faq")
@RequiredArgsConstructor
@Tag(name = "FAQ", description = "FAQ API")
public class FaqController {

    private final FaqService faqService;

    /**
     * FAQ 카테고리 목록 조회
     */
    @Operation(summary = "FAQ 카테고리 목록", description = "FAQ 카테고리 목록을 조회합니다.")
    @GetMapping("/categories")
    public ResponseEntity<Map<String, Object>> getCategories() {
        log.info("FAQ 카테고리 목록 조회");

        List<FaqCategory> categories = faqService.getCategories();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", categories);

        return ResponseEntity.ok(response);
    }

    /**
     * FAQ 목록 조회 (전체 또는 카테고리별)
     */
    @Operation(summary = "FAQ 목록 조회", description = "FAQ 목록을 조회합니다. 카테고리 파라미터로 필터링 가능합니다.")
    @GetMapping
    public ResponseEntity<Map<String, Object>> getFaqs(
            @RequestParam(required = false) FaqCategory category) {
        log.info("FAQ 목록 조회 - category: {}", category);

        List<FaqResponse> faqs;
        if (category != null) {
            faqs = faqService.getFaqsByCategory(category);
        } else {
            faqs = faqService.getAllFaqs();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", faqs);

        return ResponseEntity.ok(response);
    }

    /**
     * FAQ 상세 조회
     */
    @Operation(summary = "FAQ 상세 조회", description = "FAQ 상세 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getFaqById(@PathVariable Long id) {
        log.info("FAQ 상세 조회 - id: {}", id);

        FaqResponse faq = faqService.getFaqById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", faq);

        return ResponseEntity.ok(response);
    }

    /**
     * FAQ 검색
     */
    @Operation(summary = "FAQ 검색", description = "키워드와 카테고리로 FAQ를 검색합니다.")
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchFaqs(
            @RequestParam String keyword,
            @RequestParam(required = false) FaqCategory category) {
        log.info("FAQ 검색 - keyword: {}, category: {}", keyword, category);

        List<FaqResponse> faqs = faqService.searchFaqs(keyword, category);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", faqs);

        return ResponseEntity.ok(response);
    }

    /**
     * FAQ 버튼 클릭 (조회수 증가 후 즉시 응답)
     */
    @Operation(summary = "FAQ 버튼 클릭", description = "FAQ 버튼 클릭 시 조회수를 증가시키고 답변을 반환합니다.")
    @PostMapping("/button/{id}")
    public ResponseEntity<Map<String, Object>> clickFaq(@PathVariable Long id) {
        log.info("FAQ 버튼 클릭 - id: {}", id);

        FaqResponse faq = faqService.clickFaq(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", faq);

        return ResponseEntity.ok(response);
    }

    // ===== 관리자 API =====

    /**
     * FAQ 생성 (관리자)
     */
    @Operation(summary = "FAQ 생성", description = "새 FAQ를 생성합니다. (관리자 전용)")
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> createFaq(@Valid @RequestBody FaqRequest request) {
        log.info("FAQ 생성 요청 (관리자)");

        FaqResponse faq = faqService.createFaq(request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", faq);

        return ResponseEntity.ok(response);
    }

    /**
     * FAQ 수정 (관리자)
     */
    @Operation(summary = "FAQ 수정", description = "FAQ를 수정합니다. (관리자 전용)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateFaq(
            @PathVariable Long id,
            @Valid @RequestBody FaqRequest request) {
        log.info("FAQ 수정 요청 (관리자) - id: {}", id);

        FaqResponse faq = faqService.updateFaq(id, request);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", faq);

        return ResponseEntity.ok(response);
    }

    /**
     * FAQ 삭제 (관리자)
     */
    @Operation(summary = "FAQ 삭제", description = "FAQ를 삭제합니다. (관리자 전용)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteFaq(@PathVariable Long id) {
        log.info("FAQ 삭제 요청 (관리자) - id: {}", id);

        faqService.deleteFaq(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "FAQ가 삭제되었습니다.");

        return ResponseEntity.ok(response);
    }
}
