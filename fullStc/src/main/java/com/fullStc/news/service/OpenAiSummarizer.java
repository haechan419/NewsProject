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
                        Map.of("role", "user", "content", user)),
                "temperature", 0.2);

        return callGpt(body);
    }

    /**
     * ★ [수정됨] 뉴스 클러스터를 [제목] + [서론/본론/결론] 구조로 요약
     */
    public String summarizeCluster(List<News> newsList) {
        if (newsList == null || newsList.isEmpty())
            return "";

        // 1. 뉴스 내용 텍스트로 합치기
        StringBuilder newsContentBuilder = new StringBuilder();
        int count = 0;
        for (News n : newsList) {
            if (count++ >= 5)
                break; // 토큰 절약 (최대 5개 기사만 참고)

            newsContentBuilder.append("- 제목: ").append(n.getTitle()).append("\n");
            if (n.getContent() != null) {
                // 본문이 너무 길면 앞부분 300자만 자름
                String body = n.getContent().length() > 300 ? n.getContent().substring(0, 300) : n.getContent();
                newsContentBuilder.append("  내용: ").append(body).append("\n\n");
            }
        }

        // 2. [서론-본론-결론] 프롬프트 작성
        String prompt = """
                    너는 전문 뉴스 에디터야. 아래 제공된 뉴스 기사들을 종합해서 하나의 완벽한 브리핑 리포트를 작성해줘.

                    [필수 지침]
                    1. 독자가 사건을 한눈에 파악할 수 있도록 **[서론] - [본론] - [결론]** 구조를 반드시 지켜줘.
                    2. **[제목]**은 가장 핵심적이고 사람들의 이목을 끌 수 있는 문장으로 맨 윗줄에 작성해줘.
                    3. 내용은 한국어로 자연스럽게 작성해.

                    [출력 형식 예시]
                    [제목] 여기에 제목 작성

                    [서론]
                    (사건의 배경과 핵심 요약을 1~2문장으로 기술)

                    [본론]
                    (주요 사실 관계, 쟁점, 구체적인 수치나 데이터를 포함하여 상세히 기술)

                    [결론]
                    (향후 전망, 시사점, 또는 마무리 멘트)

                    ---
                    [뉴스 데이터]
                    %s
                """.formatted(newsContentBuilder.toString());

        // 3. GPT 요청
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are a helpful news assistant."),
                        Map.of("role", "user", "content", prompt)),
                "temperature", 0.7 // 조금 더 자연스러운 문장을 위해 온도 살짝 높임
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

            if (resp == null)
                return null;

            List choices = (List) resp.get("choices");
            Map first = (Map) choices.get(0);
            Map msg = (Map) first.get("message");
            return (String) msg.get("content");

        } catch (Exception e) {
            System.out.println("GPT 호출 실패: " + e.getMessage());
            return null;
        }
    }

    /**
     * ★ [NEW] 한글 요약문을 받아서 -> 고퀄리티 영어 그림 프롬프트로 변환
     */
    public String createEnglishPrompt(String koreanSummary) {
        // [수정] 오직 프롬프트 내용만 출력하도록 강제합니다.
        String system = "너는 AI 이미지 프롬프트 엔지니어다. 불필요한 서론(Here is...)이나 제목(Image Prompt:)은 절대 빼고, 오직 영문 프롬프트 내용만 한 줄로 출력해라.";

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", system),
                        Map.of("role", "user", "content", "아래 내용을 4K 뉴스 사진 스타일의 영문 프롬프트로 바꿔: " + koreanSummary)
                ),
                "temperature", 0.5 // 일관성을 위해 온도를 조금 낮춤
        );

        return callGpt(body);
    }
}