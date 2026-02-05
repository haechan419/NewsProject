package com.fullStc.ai.controller;

import com.fullStc.ai.dto.ChatRequestDTO;
import com.fullStc.ai.dto.ChatResponseDTO;
import com.fullStc.ai.service.AiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * AI 채팅 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Chat", description = "AI 챗봇 API")
public class AiController {
    
    private final AiService aiService;
    
    /**
     * AI 채팅 메시지 전송
     */
    @Operation(summary = "AI 채팅", description = "AI에게 메시지를 전송하고 응답을 받습니다.")
    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody ChatRequestDTO requestDTO) {
        log.info("AI 채팅 요청 - 메시지: {}", requestDTO.getMessage());
        
        try {
            ChatResponseDTO responseDTO = aiService.chat(requestDTO);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", responseDTO);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("AI 채팅 에러: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 대화 초기화 (세션 기반 시 사용)
     */
    @Operation(summary = "대화 초기화", description = "대화 기록을 초기화합니다.")
    @PostMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearConversation() {
        log.info("대화 초기화 요청");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "대화가 초기화되었습니다.");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * 실시간 검색어 조회
     */
    @Operation(summary = "실시간 검색어 조회", description = "현재 실시간 인기 검색어를 조회합니다.")
    @GetMapping("/trending")
    public ResponseEntity<Map<String, Object>> getTrendingKeywords() {
        log.info("실시간 검색어 조회 요청");
        
        try {
            Map<String, Object> trendingData = aiService.getTrendingKeywords();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", trendingData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("실시간 검색어 조회 에러: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
