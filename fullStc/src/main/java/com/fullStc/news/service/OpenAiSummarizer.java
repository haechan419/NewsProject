package com.fullStc.news.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import com.fullStc.news.domain.News;

import java.util.List;
import java.util.Map;

@Service
public class OpenAiSummarizer {

    private final WebClient client;

    @Value("${openai.model:gpt-4o-mini}")
    private String model;

    public OpenAiSummarizer(@Value("${openai.apiKey}") String apiKey) {
        this.client = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    // (기사 1개 요약용 - 기존 유지)
    public String summarizeNewsKo(String title, String content) {
        String system = "너는 뉴스 요약기다. 추측 금지. 기사에 있는 사실만. 한국어로.";
        String user = """
                아래 기사 내용을 요약해라.

                [제목]
                %s

                [본문]
                %s

                [출력 형식]
                1) 한줄 요약 (25~35자)
                2) 핵심 3줄 (각 40자 이내 bullet)
                3) 사실 체크 포인트 2개 (서로 다른 출처로 교차검증 필요한 문장)
                """.formatted(title, content);

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", user)
                ),
                "temperature", 0.2
        );

        return callGpt(body);
    }

    /**
     * ★ [NEW] 뉴스 클러스터(여러 기사)를 읽고 "제목 + 3줄 요약"을 반환
     */
    public String summarizeCluster(List<News> newsList) {
        if (newsList == null || newsList.isEmpty()) return "";

        // 1. 프롬프트 만들기 (제목과 요약을 나눠서 달라고 강력하게 요청)
        StringBuilder sb = new StringBuilder();
        sb.append("이 뉴스들을 종합해서 다음 형식으로 출력해.\n");
        sb.append("첫째줄: 전체 내용을 아우르는 30자 이내의 깔끔한 헤드라인(제목). 따옴표나 수식어 없이 담백하게.\n");
        sb.append("둘째줄부터: 핵심 내용 3줄 요약 (명사형 종결, -음/함 체)\n\n");
        sb.append("[기사 목록]\n");

        int count = 0;
        for (News n : newsList) {
            if (count++ >= 5) break; // 토큰 절약 (최대 5개)
            sb.append("- ").append(n.getTitle()).append("\n");
            // 본문 내용 붙이기 (너무 길면 자름)
            if (n.getContent() != null) {
                String body = n.getContent().length() > 200 ? n.getContent().substring(0, 200) : n.getContent();
                sb.append("  내용: ").append(body).append("\n\n");
            }
        }

        // 2. GPT 요청
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "너는 뉴스 편집장이야. 여러 기사를 읽고 완벽한 헤드라인과 요약을 뽑아내."),
                        Map.of("role", "user", "content", sb.toString())
                ),
                "temperature", 0.3
        );

        return callGpt(body);
    }

    /**
     * 한국어 요약을 영어 프롬프트로 변환
     */
    public String createEnglishPrompt(String koreanSummary) {
        if (koreanSummary == null || koreanSummary.trim().isEmpty()) {
            return null;
        }

        String system = "You are a translator. Translate the Korean text into a concise English prompt suitable for image generation. Keep it under 80 characters.";
        String user = "Translate this Korean text into a short English prompt for image generation:\n\n" + koreanSummary;

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", user)
                ),
                "temperature", 0.3,
                "max_tokens", 100
        );

        return callGpt(body);
    }

    // (중복 코드 제거용 내부 메소드)
    private String callGpt(Map<String, Object> body) {
        try {
            Map resp = client.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (resp == null) return null;

            List choices = (List) resp.get("choices");
            Map first = (Map) choices.get(0);
            Map msg = (Map) first.get("message");
            return (String) msg.get("content");

        } catch (Exception e) {
            System.out.println("GPT 호출 실패: " + e.getMessage());
            return null;
        }
    }
}