package com.fullStc.ai.service;

import com.fullStc.ai.dto.ChatRequestDTO;
import com.fullStc.ai.dto.ChatResponseDTO;

import java.util.Map;

/**
 * AI 채팅 서비스 인터페이스
 */
public interface AiService {
    
    /**
     * AI 채팅 메시지 처리
     * 
     * @param requestDTO 채팅 요청 DTO
     * @return 채팅 응답 DTO
     */
    ChatResponseDTO chat(ChatRequestDTO requestDTO);

    /**
     * 실시간 검색어 조회
     *
     * @return 실시간 검색어 데이터
     */
    Map<String, Object> getTrendingKeywords();
}
