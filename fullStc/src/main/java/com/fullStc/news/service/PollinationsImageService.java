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

    // ★ [수정] 없는 클래스 대신 기존에 있는 Summarizer 주입
    private final OpenAiSummarizer openAiSummarizer;

    public String generateImageUrl(String koreanSummary) {
        try {
            String englishPrompt = openAiSummarizer.createEnglishPrompt(koreanSummary);
            if (englishPrompt == null) return null;

            // 1. 불필요한 서론/조사 제거 및 특수문자 청소
            String clean = englishPrompt
                    .replaceAll("(?i)^.*?(Prompt|Create|Imagine|is):", "")
                    .replaceAll("[^a-zA-Z0-9\\s]", "") // 쉼표, 마침표도 다 지우세요. 공백만 남깁니다.
                    .replaceAll("\\s+", " ")
                    .trim();

            // 2. ★ 글자 수 대폭 제한 (70~100자 사이가 가장 잘 나옵니다)
            // 문장이 길면 서버가 튕겨내므로, 핵심 키워드 몇 개만 남기는 게 유리합니다.
            if (clean.length() > 80) {
                clean = clean.substring(0, 80);
            }

            log.info("🌸 [Pollinations] 최종 숏 프롬프트: {}", clean);

            String encoded = URLEncoder.encode(clean, StandardCharsets.UTF_8).replace("+", "%20");

            return String.format(
                    "https://pollinations.ai/p/%s?width=1024&height=600&seed=%d&model=flux&nologo=true",
                    encoded,
                    ThreadLocalRandom.current().nextInt(0, 1000000)
            );
        } catch (Exception e) {
            return null;
        }
    }
    }
