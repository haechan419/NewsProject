package com.fullStc.news.service;

import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.dto.UnsplashResponse;
import com.fullStc.news.repository.NewsClusterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class PollinationsImageService {

    private final OpenAiSummarizer openAiSummarizer;
    private final NewsClusterRepository newsClusterRepository;

    // 외부 API 호출용 도구
    private final RestTemplate restTemplate = new RestTemplate();

    // application.properties(yml)에서 키 가져오기
    @Value("${unsplash.access-key}")
    private String unsplashAccessKey;

    /**
     * ✅ [최종 수정] 속도 최적화 로직
     * 1순위: Unsplash API (0.5초 소요, 고화질)
     * 2순위: 하드코딩된 기본 이미지 (0초 소요, 절대 실패 안 함)
     * (기존의 느린 AI 생성 로직은 제거함)
     */
    public String generateImageUrl(String koreanSummary) {
        try {
            log.info("🚀 [속도 우선] AI 생성 건너뛰고 Unsplash 검색 시도...");

            // 1. 검색어 만들기 (GPT에게 영어 키워드 요청)
            String englishPrompt = openAiSummarizer.createEnglishPrompt(koreanSummary);
            if (englishPrompt == null) englishPrompt = "News";

            // 2. 검색어 단순화 (Unsplash는 'Futuristic AI city...'보다 'Technology' 같은 단어가 더 잘 나옴)
            String searchKeyword = getSimpleKeyword(englishPrompt);

            // 3. Unsplash API 호출
            String unsplashUrl = getUnsplashImage(searchKeyword);

            // 4. 성공 시 URL 반환
            if (unsplashUrl != null) {
                return unsplashUrl;
            }

            // 실패 시 예외를 던져서 catch 블록으로 이동
            throw new RuntimeException("Unsplash Returned Null");

        } catch (Exception e) {
            log.warn("⚠️ 이미지 확보 실패 -> '기본 안전 이미지' 사용: {}", e.getMessage());

            // 5. [최후의 보루] 절대 실패하지 않는 반도체/기술 배경 이미지 리턴
            return "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080";
        }
    }

    /**
     * Unsplash 정식 API 호출
     */
    private String getUnsplashImage(String query) {
        try {
            // orientation=landscape: 가로 사진만 검색
            String url = "https://api.unsplash.com/photos/random?query=" + query + "&orientation=landscape";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Client-ID " + unsplashAccessKey);

            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<UnsplashResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    UnsplashResponse.class
            );

            if (response.getBody() != null && response.getBody().getUrls() != null) {
                String result = response.getBody().getUrls().getRegular();
                log.info("📸 Unsplash 이미지 확보 성공: {}", result);
                return result;
            }
        } catch (Exception ex) {
            // 403(한도초과), 401(키 오류) 등 로그만 남기고 null 리턴
            log.error("💥 Unsplash API 에러 (키 확인 필요): {}", ex.getMessage());
        }
        return null;
    }

    /**
     * 문장에서 핵심 키워드 1개만 뽑기 (검색 정확도 & 속도 향상용)
     */
    private String getSimpleKeyword(String prompt) {
        String p = prompt.toLowerCase();

        if (p.contains("economy") || p.contains("finance") || p.contains("stock")) return "economy";
        if (p.contains("politics") || p.contains("government") || p.contains("president")) return "politics";
        if (p.contains("it") || p.contains("tech") || p.contains("ai") || p.contains("computer")) return "technology";
        if (p.contains("society") || p.contains("people") || p.contains("city")) return "city";
        if (p.contains("culture") || p.contains("art") || p.contains("music")) return "art";
        if (p.contains("world") || p.contains("global")) return "world map";

        // 아무것도 해당 안 되면 그냥 뉴스 느낌
        return "newspaper";
    }

    /**
     * 비동기 재시도 (컨트롤러에서 호출됨)
     */
    @Async
    @Transactional
    public void retryGenerateAsync(Long clusterId) {
        NewsCluster cluster = newsClusterRepository.findById(clusterId).orElse(null);
        if (cluster == null) return;

        // 위에서 만든 '빠른 로직' 호출
        String newUrl = generateImageUrl(cluster.getClusterSummary());

        if (newUrl != null && !newUrl.isBlank()) {
            cluster.setImageUrl(newUrl);
            cluster.setImageStatus("OK");
            cluster.setImageNextRetryAt(null);
            newsClusterRepository.save(cluster);
            log.info("✅ [이미지 갱신 완료] Cluster ID: {}", clusterId);
        }
    }
}