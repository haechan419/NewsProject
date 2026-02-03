package com.fullStc.support.service;

import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;
import com.fullStc.support.domain.Faq;
import com.fullStc.support.domain.QaHistory;
import com.fullStc.support.dto.*;
import com.fullStc.support.repository.FaqRepository;
import com.fullStc.support.repository.QaHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Q&A 서비스 구현체
 * FAQ DB 참조 + GPT-4o-mini (Python 서버) 연동
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QaServiceImpl implements QaService {

    private final QaHistoryRepository qaHistoryRepository;
    private final FaqRepository faqRepository;
    private final MemberRepository memberRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.python.server.url:http://localhost:8000}")
    private String pythonServerUrl;

    @Override
    @Transactional
    public QaMessageResponse sendMessage(Long userId, QaMessageRequest request) {
        log.info("Q&A 메시지 처리 - userId: {}, message: {}", userId, request.getMessage());

        // 1. 사용자 조회
        Member user = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 2. 세션 ID 생성 또는 사용
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.isEmpty()) {
            sessionId = UUID.randomUUID().toString();
        }

        // 3. FAQ DB에서 관련 FAQ 검색
        List<Faq> relatedFaqs = searchRelatedFaqs(request.getMessage());
        log.info("관련 FAQ 검색 결과: {} 건", relatedFaqs.size());

        // 4. Python 서버의 GPT-4o-mini API 호출 (FAQ 정보 포함)
        String aiReply;
        try {
            aiReply = callPythonQaApi(request.getMessage(), request.getConversationHistory(), relatedFaqs);
        } catch (Exception e) {
            log.error("Python Q&A API 호출 실패: {}", e.getMessage());
            aiReply = "죄송합니다. 현재 AI 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
        }

        // 6. 대화 히스토리 저장
        Faq primaryFaq = relatedFaqs.isEmpty() ? null : relatedFaqs.get(0);
        QaHistory history = QaHistory.builder()
                .user(user)
                .sessionId(sessionId)
                .userQuestion(request.getMessage())
                .aiAnswer(aiReply)
                .relatedFaq(primaryFaq)
                .build();
        qaHistoryRepository.save(history);

        // 7. 응답 생성
        List<FaqResponse> faqResponses = relatedFaqs.stream()
                .map(FaqResponse::from)
                .collect(Collectors.toList());

        return QaMessageResponse.builder()
                .reply(aiReply)
                .sessionId(sessionId)
                .timestamp(LocalDateTime.now())
                .relatedFaqs(faqResponses)
                .build();
    }

    @Override
    public List<QaHistoryResponse> getHistory(Long userId) {
        log.info("Q&A 히스토리 조회 - userId: {}", userId);
        return qaHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(QaHistoryResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<QaHistoryResponse> getHistoryBySession(Long userId, String sessionId) {
        log.info("Q&A 세션별 히스토리 조회 - userId: {}, sessionId: {}", userId, sessionId);
        return qaHistoryRepository.findByUserIdAndSessionIdOrderByCreatedAtAsc(userId, sessionId)
                .stream()
                .map(QaHistoryResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 사용자 질문에서 관련 FAQ 검색
     */
    private List<Faq> searchRelatedFaqs(String question) {
        // 질문에서 키워드 추출 (간단한 방식)
        String[] keywords = question.split("\\s+");
        Set<Faq> resultSet = new LinkedHashSet<>();

        for (String keyword : keywords) {
            if (keyword.length() >= 2) {  // 2글자 이상만 검색
                List<Faq> found = faqRepository.searchByKeyword(keyword);
                resultSet.addAll(found);
            }
        }

        // 최대 3개만 반환
        return resultSet.stream().limit(3).collect(Collectors.toList());
    }

    /**
     * Python 서버의 GPT-4o-mini Q&A API 호출
     */
    private String callPythonQaApi(String userMessage, 
                                   List<QaMessageRequest.ConversationMessage> history,
                                   List<Faq> relatedFaqs) {
        log.info("Python Q&A API 호출 시작 - URL: {}", pythonServerUrl);

        try {
            // FAQ 데이터를 Map 리스트로 변환
            List<Map<String, String>> faqData = new ArrayList<>();
            for (Faq faq : relatedFaqs) {
                Map<String, String> faqMap = new HashMap<>();
                faqMap.put("category", faq.getCategory() != null ? faq.getCategory().getDisplayName() : "");
                faqMap.put("question", faq.getQuestion());
                faqMap.put("answer", faq.getAnswer());
                faqData.add(faqMap);
            }
            
            log.info("Python Q&A API로 전송할 FAQ 데이터: {}건", faqData.size());
            if (!faqData.isEmpty()) {
                log.debug("FAQ 데이터 샘플: {}", faqData.get(0));
            }
            
            // 요청 본문 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("message", userMessage);
            requestBody.put("faq_data", faqData);
            
            // 대화 기록 변환
            if (history != null && !history.isEmpty()) {
                List<Map<String, String>> conversationHistory = new ArrayList<>();
                for (QaMessageRequest.ConversationMessage msg : history) {
                    Map<String, String> historyMsg = new HashMap<>();
                    historyMsg.put("role", msg.getRole());
                    historyMsg.put("content", msg.getContent());
                    conversationHistory.add(historyMsg);
                }
                requestBody.put("conversation_history", conversationHistory);
            }
            
            // HTTP 요청
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(requestBody, headers);
            
            String url = pythonServerUrl + "/qa";
            log.debug("Python Q&A 요청 URL: {}", url);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, httpEntity, Map.class);
            
            if (response != null && response.containsKey("reply")) {
                String reply = (String) response.get("reply");
                log.info("Python Q&A API 응답 수신 완료");
                return reply;
            }
            
            log.error("Python Q&A API 응답 형식 오류");
            return "죄송합니다. AI 응답을 처리하는 중 오류가 발생했습니다.";
            
        } catch (RestClientException e) {
            String errorMessage = e.getMessage();
            log.error("Python Q&A API 통신 오류: {}", errorMessage);
            
            // 타임아웃 오류인지 확인
            if (errorMessage != null && (errorMessage.contains("Read timed out") || 
                                         errorMessage.contains("timeout") ||
                                         errorMessage.contains("Timed out"))) {
                log.warn("Python Q&A API 응답 타임아웃 발생. 서버가 응답하지 않거나 너무 느립니다.");
                return "죄송합니다. AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.";
            }
            
            // 연결 오류인지 확인
            if (errorMessage != null && (errorMessage.contains("Connection refused") ||
                                         errorMessage.contains("connect timed out") ||
                                         errorMessage.contains("I/O error"))) {
                log.warn("Python Q&A API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.");
                return "죄송합니다. AI 서버에 연결할 수 없습니다. 서버 상태를 확인 중입니다.";
            }
            
            // 기타 오류
            throw new RuntimeException("AI 서버와 통신 중 오류가 발생했습니다: " + errorMessage, e);
        }
    }
}
