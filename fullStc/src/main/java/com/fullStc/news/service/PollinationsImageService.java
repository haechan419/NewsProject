package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class PollinationsImageService {

    private final OpenAiSummarizer openAiSummarizer;
    public String generateImageUrl(String koreanSummary) {
        try {
            // 1. GPT에게 요약 요청 (이건 그대로)
            String englishPrompt = openAiSummarizer.createEnglishPrompt(koreanSummary);
            if (englishPrompt == null) englishPrompt = "Technology";

            // 2. ★ [핵심] 추상적인 단어 & 동사 '학살' 리스트
            // 이 단어들이 보이면 무조건 지워버립니다.
            String[] stopWords = {
                    "announces", "announce", "announced", "support", "supports", "supporting",
                    "report", "reports", "reported", "plan", "plans", "planning",
                    "develop", "develops", "developing", "korean", "korea", // 국가는 가끔 오해를 부름
                    "aim", "target", "goal", "strategy", "policy", "law",
                    "daily", "briefing", "summary", "today", "news",
                    "a", "an", "the", "of", "in", "on", "at", "to", "for"
            };

            String temp = englishPrompt.toLowerCase();
            for (String stop : stopWords) {
                temp = temp.replaceAll("\\b" + stop + "\\b", "");
            }

            // 3. 특수문자 제거 및 공백 정리
            String cleanPrompt = temp.replaceAll("[^a-z0-9\\s]", "").replaceAll("\\s+", " ").trim();

            // 4. ★ [안전장치] 만약 다 지워서 남는 게 별로 없으면? -> "멋진 기술 배경"으로 대체
            // (길이가 5글자 이하이면 AI가 못 그림)
            if (cleanPrompt.length() < 5) {
                cleanPrompt = "Future Technology Data Center";
            }

            // 5. 길이 제한 (20자면 충분. 길면 AI가 뇌정지 옴)
            if (cleanPrompt.length() > 25) {
                cleanPrompt = cleanPrompt.substring(0, 25);
            }

            // 6. ★ [마법의 단어] 뒤에 "3D 렌더링" 키워드 붙이기 (가장 에러 안 나는 스타일)
            // cinematic보다 '3d render'나 'cyberpunk'가 훨씬 성공률 높음
            String finalPrompt = cleanPrompt + " 3d render isometric";

            log.info("🌸 [Pollinations] 최종 생존 키워드: {}", finalPrompt);

            String encoded = URLEncoder.encode(finalPrompt, StandardCharsets.UTF_8).replace("+", "%20");

            // 7. URL 생성 (seed를 랜덤으로 줘서 캐싱 문제 회피)
            return String.format(
                    "https://image.pollinations.ai/prompt/%s?width=1024&height=600&seed=%d&model=turbo&nologo=true",
                    encoded,
                    ThreadLocalRandom.current().nextInt(0, 1000000)
            );

        } catch (Exception e) {
            log.error("💥 이미지 생성 로직 실패: {}", e.getMessage());
            // 에러 나면 아예 안전한 기본 이미지 URL 리턴
            return "https://image.pollinations.ai/prompt/computer%20chip%20technology?width=1024&height=600&model=turbo&nologo=true";
        }
    

    }
}
