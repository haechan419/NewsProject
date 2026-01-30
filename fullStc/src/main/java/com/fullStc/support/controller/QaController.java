package com.fullStc.support.controller;

import com.fullStc.support.dto.QaHistoryResponse;
import com.fullStc.support.dto.QaMessageRequest;
import com.fullStc.support.dto.QaMessageResponse;
import com.fullStc.support.service.QaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Q&A 챗봇 컨트롤러
 * HyperCLOVA AI를 통한 고객센터 Q&A
 */
@Slf4j
@RestController
@RequestMapping("/api/qa")
@RequiredArgsConstructor
@Tag(name = "Q&A Chatbot", description = "고객센터 Q&A 챗봇 API (HyperCLOVA)")
public class QaController {

    private final QaService qaService;

    /**
     * Q&A 메시지 전송
     */
    @Operation(summary = "Q&A 메시지 전송", description = "질문을 전송하고 HyperCLOVA AI의 답변을 받습니다.")
    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> sendMessage(@RequestBody QaMessageRequest request) {
        Long userId = getCurrentUserId();
        log.info("Q&A 메시지 요청 - userId: {}, message: {}", userId, request.getMessage());

        try {
            QaMessageResponse response = qaService.sendMessage(userId, request);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", response);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Q&A 메시지 처리 에러: {}", e.getMessage());

            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());

            return ResponseEntity.internalServerError().body(errorResult);
        }
    }

    /**
     * Q&A 대화 히스토리 조회
     */
    @Operation(summary = "Q&A 히스토리 조회", description = "사용자의 Q&A 대화 히스토리를 조회합니다.")
    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory() {
        Long userId = getCurrentUserId();
        log.info("Q&A 히스토리 조회 - userId: {}", userId);

        List<QaHistoryResponse> history = qaService.getHistory(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", history);

        return ResponseEntity.ok(response);
    }

    /**
     * Q&A 세션별 대화 히스토리 조회
     */
    @Operation(summary = "세션별 Q&A 히스토리 조회", description = "특정 세션의 Q&A 대화 히스토리를 조회합니다.")
    @GetMapping("/history/{sessionId}")
    public ResponseEntity<Map<String, Object>> getHistoryBySession(@PathVariable String sessionId) {
        Long userId = getCurrentUserId();
        log.info("Q&A 세션별 히스토리 조회 - userId: {}, sessionId: {}", userId, sessionId);

        List<QaHistoryResponse> history = qaService.getHistoryBySession(userId, sessionId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", history);

        return ResponseEntity.ok(response);
    }

    /**
     * 현재 로그인한 사용자 ID 조회
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() != null) {
            Object principal = authentication.getPrincipal();

            // MemberDTO 타입인 경우 (JwtCheckFilter에서 설정)
            if (principal instanceof com.fullStc.member.dto.MemberDTO) {
                com.fullStc.member.dto.MemberDTO memberDTO = (com.fullStc.member.dto.MemberDTO) principal;
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
        throw new RuntimeException("인증 정보를 찾을 수 없습니다.");
    }
}
