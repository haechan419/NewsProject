package com.fullStc.ai.service;

import com.fullStc.ai.dto.ChatRequestDTO;
import com.fullStc.ai.dto.ChatResponseDTO;
import com.fullStc.ai.dto.PythonChatRequestDTO;
import com.fullStc.ai.dto.PythonChatResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AI 채팅 서비스 구현체
 * Python FastAPI 서버와 통신
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private final RestTemplate restTemplate;

    /** Python FastAPI 서버 URL */
    @Value("${ai.python.server.url:http://localhost:8000}")
    private String pythonServerUrl;

    @Override
    public ChatResponseDTO chat(ChatRequestDTO requestDTO) {
        log.info("AI 채팅 요청: {}", requestDTO != null ? requestDTO.getMessage() : "null");

        // 요청 데이터 검증
        if (requestDTO == null || requestDTO.getMessage() == null || requestDTO.getMessage().trim().isEmpty()) {
            log.error("AI 채팅 요청 데이터가 유효하지 않습니다: {}", requestDTO);
            throw new IllegalArgumentException("메시지를 입력해주세요.");
        }

        try {
            // Python 서버로 전송할 요청 생성
            PythonChatRequestDTO pythonRequest = convertToPhythonRequest(requestDTO);
            log.debug("Python 요청 데이터: message={}, history size={}",
                    pythonRequest.getMessage(),
                    pythonRequest.getConversationHistory() != null ? pythonRequest.getConversationHistory().size() : 0);

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // HTTP 요청 생성
            HttpEntity<PythonChatRequestDTO> httpEntity = new HttpEntity<>(pythonRequest, headers);

            // Python 서버에 POST 요청
            String url = pythonServerUrl + "/chat";
            log.debug("Python 서버 요청 URL: {}", url);

            PythonChatResponseDTO pythonResponse = restTemplate.postForObject(
                url,
                httpEntity,
                PythonChatResponseDTO.class
            );

            if (pythonResponse == null || pythonResponse.getReply() == null) {
                log.error("Python 서버로부터 빈 응답 수신");
                throw new RuntimeException("AI 응답을 받지 못했습니다.");
            }

            log.info("AI 채팅 응답 수신 완료");

            // Python 응답의 sources를 ChatResponseDTO의 sources로 변환
            List<ChatResponseDTO.SearchSource> sources = null;
            if (pythonResponse.getSources() != null && !pythonResponse.getSources().isEmpty()) {
                sources = pythonResponse.getSources().stream()
                    .map(src -> new ChatResponseDTO.SearchSource(
                        src.getTitle(),
                        src.getUrl(),
                        src.getSnippet()
                    ))
                    .collect(Collectors.toList());
                log.info("검색 출처 {}개 변환 완료", sources.size());
            }

            // Python 응답의 trendingData를 ChatResponseDTO의 trendingData로 변환
            ChatResponseDTO.TrendingData trendingData = null;
            if (pythonResponse.getIsTrending() != null && pythonResponse.getIsTrending()
                && pythonResponse.getTrendingData() != null) {

                PythonChatResponseDTO.TrendingData pyTrending = pythonResponse.getTrendingData();

                List<ChatResponseDTO.TrendingKeyword> keywords = null;
                if (pyTrending.getKeywords() != null) {
                    keywords = pyTrending.getKeywords().stream()
                        .map(kw -> new ChatResponseDTO.TrendingKeyword(
                            kw.getRank(),
                            kw.getKeyword(),
                            kw.getState()
                        ))
                        .collect(Collectors.toList());
                }

                trendingData = ChatResponseDTO.TrendingData.builder()
                    .keywords(keywords)
                    .updatedAt(pyTrending.getUpdatedAt())
                    .source(pyTrending.getSource())
                    .build();

                log.info("실시간 검색어 데이터 변환 완료: {}개 키워드",
                    keywords != null ? keywords.size() : 0);
            }

            return ChatResponseDTO.builder()
                    .reply(pythonResponse.getReply())
                    .timestamp(LocalDateTime.now())
                    .searched(pythonResponse.getSearched() != null ? pythonResponse.getSearched() : false)
                    .searchQuery(pythonResponse.getSearchQuery())
                    .sources(sources)
                    .isTrending(pythonResponse.getIsTrending() != null ? pythonResponse.getIsTrending() : false)
                    .trendingData(trendingData)
                    .build();

        } catch (RestClientException e) {
            log.error("Python 서버 통신 에러: {}", e.getMessage());
            throw new RuntimeException("AI 서버와 통신 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * DTO 변환: 클라이언트 요청 → Python 요청
     */
    private PythonChatRequestDTO convertToPhythonRequest(ChatRequestDTO requestDTO) {
        List<PythonChatRequestDTO.ConversationMessage> history = null;

        if (requestDTO.getConversationHistory() != null) {
            history = requestDTO.getConversationHistory().stream()
                    .map(msg -> new PythonChatRequestDTO.ConversationMessage(
                            msg.getRole(),
                            msg.getContent()
                    ))
                    .collect(Collectors.toList());
        }

        return PythonChatRequestDTO.builder()
                .message(requestDTO.getMessage())
                .conversationHistory(history)
                .build();
    }

    /**
     * 실시간 검색어 조회
     * Python FastAPI 서버의 /trending 엔드포인트 호출
     */
    @Override
    @SuppressWarnings("unchecked")
    public java.util.Map<String, Object> getTrendingKeywords() {
        log.info("실시간 검색어 조회 요청");

        try {
            String url = pythonServerUrl + "/trending";
            log.debug("Python 서버 요청 URL: {}", url);

            java.util.Map<String, Object> response = restTemplate.getForObject(url, java.util.Map.class);

            if (response == null) {
                log.warn("Python 서버로부터 빈 응답 수신");
                return java.util.Map.of(
                    "keywords", java.util.List.of(),
                    "updated_at", null
                );
            }

            log.info("실시간 검색어 조회 완료");
            return response;

        } catch (RestClientException e) {
            log.error("Python 서버 통신 에러: {}", e.getMessage());
            throw new RuntimeException("실시간 검색어 조회 중 오류가 발생했습니다.", e);
        }
    }
}
