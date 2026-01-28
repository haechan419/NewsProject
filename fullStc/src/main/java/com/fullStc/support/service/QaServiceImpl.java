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
 * FAQ DB 참조 + HyperCLOVA AI (Msty) 연동
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

    @Value("${ai.msty.server.url:http://localhost:11964}")
    private String mstyServerUrl;

    @Value("${ai.msty.model:hf.co/rippertnt/HyperCLOVA-SEED-Text-Instruct-1.5B-Q4_K_M-GGUF:hyperclovax-seed-text-instruct-1.5b-q4_k_m.gguf}")
    private String mstyModel;

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

        // 4. 시스템 프롬프트 생성 (FAQ 정보 포함)
        String systemPrompt = buildSystemPrompt(relatedFaqs);

        // 5. Msty (HyperCLOVA) API 호출
        String aiReply;
        try {
            aiReply = callMstyApi(systemPrompt, request.getMessage(), request.getConversationHistory());
        } catch (Exception e) {
            log.error("Msty API 호출 실패: {}", e.getMessage());
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
     * 시스템 프롬프트 생성 (FAQ 정보 포함)
     */
    private String buildSystemPrompt(List<Faq> relatedFaqs) {
        StringBuilder sb = new StringBuilder();
        sb.append("당신은 뉴스 플랫폼 고객센터의 친절한 AI 상담원입니다.\n");
        sb.append("사용자의 질문에 명확하고 도움이 되는 답변을 제공해주세요.\n");
        sb.append("한국어로 대화하며, 존댓말을 사용합니다.\n\n");

        if (!relatedFaqs.isEmpty()) {
            sb.append("다음은 참고할 수 있는 FAQ 정보입니다:\n\n");
            for (int i = 0; i < relatedFaqs.size(); i++) {
                Faq faq = relatedFaqs.get(i);
                sb.append("--- FAQ ").append(i + 1).append(" ---\n");
                sb.append("카테고리: ").append(faq.getCategory().getDisplayName()).append("\n");
                sb.append("질문: ").append(faq.getQuestion()).append("\n");
                sb.append("답변: ").append(faq.getAnswer()).append("\n\n");
            }
            sb.append("위 FAQ 정보를 참고하여 사용자의 질문에 답변해주세요.\n");
            sb.append("FAQ에 정확히 일치하는 내용이 있으면 해당 내용을 바탕으로 답변하고,\n");
            sb.append("없으면 일반적인 안내를 제공해주세요.\n");
        }

        return sb.toString();
    }

    /**
     * Msty (HyperCLOVA) API 호출
     */
    private String callMstyApi(String systemPrompt, String userMessage, 
                               List<QaMessageRequest.ConversationMessage> history) {
        log.info("Msty API 호출 시작 - URL: {}", mstyServerUrl);

        try {
            // OpenAI 호환 API 형식으로 요청 구성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", mstyModel);
            requestBody.put("max_tokens", 1024);
            requestBody.put("temperature", 0.7);

            // 메시지 구성
            List<Map<String, String>> messages = new ArrayList<>();

            // 시스템 프롬프트
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content", systemPrompt);
            messages.add(systemMsg);

            // 이전 대화 기록
            if (history != null && !history.isEmpty()) {
                for (QaMessageRequest.ConversationMessage msg : history) {
                    Map<String, String> historyMsg = new HashMap<>();
                    historyMsg.put("role", msg.getRole());
                    historyMsg.put("content", msg.getContent());
                    messages.add(historyMsg);
                }
            }

            // 현재 사용자 메시지
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", userMessage);
            messages.add(userMsg);

            requestBody.put("messages", messages);

            // HTTP 요청
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> httpEntity = new HttpEntity<>(requestBody, headers);

            String url = mstyServerUrl + "/v1/chat/completions";
            log.debug("Msty 요청 URL: {}", url);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, httpEntity, Map.class);

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    String content = (String) message.get("content");
                    log.info("Msty API 응답 수신 완료");
                    return content;
                }
            }

            log.error("Msty API 응답 형식 오류");
            return "죄송합니다. AI 응답을 처리하는 중 오류가 발생했습니다.";

        } catch (RestClientException e) {
            log.error("Msty API 통신 오류: {}", e.getMessage());
            throw new RuntimeException("AI 서버와 통신 중 오류가 발생했습니다.", e);
        }
    }
}
