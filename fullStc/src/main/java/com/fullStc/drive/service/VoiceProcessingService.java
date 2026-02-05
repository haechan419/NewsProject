package com.fullStc.drive.service;

import com.fullStc.drive.dto.CommandIntentResponse;
import com.fullStc.drive.dto.DriveSettingsDto;
import com.fullStc.drive.dto.NewsItemDto;
import com.fullStc.drive.dto.NewsSummaryDto;
import com.fullStc.drive.dto.VoiceCommandResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceProcessingService {

    @Value("${python.server.url:http://localhost:8000}")
    private String pythonServerUrl;

    @Qualifier("driveRestTemplate")
    private final RestTemplate restTemplate;

    /**
     * Python 서버로 복잡한 명령어 분석 요청
     */
    public CommandIntentResponse analyzeComplexCommand(String rawText, Long userId) {
        try {
            String url = pythonServerUrl + "/api/drive/analyze-intent";
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("raw_text", rawText);
            requestBody.put("user_id", userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> httpResponse = (ResponseEntity<Map<String, Object>>)
                (ResponseEntity<?>) restTemplate.postForEntity(url, request, Map.class);

            if (httpResponse.getStatusCode().is2xxSuccessful() && httpResponse.getBody() != null) {
                Map<String, Object> body = httpResponse.getBody();
                Object confidenceObj = body.get("confidence");
                Float confidence = confidenceObj != null
                    ? ((Number) confidenceObj).floatValue()
                    : 0.0f;
                String intent = (String) body.get("intent");
                String message = (String) body.get("message");

                CommandIntentResponse intentResponse = CommandIntentResponse.builder()
                        .intent(intent)
                        .confidence(confidence)
                        .processedLocally(false)
                        .message(message)
                        .build();
                intentResponse.setRawText(rawText);
                return intentResponse;
            }
        } catch (Exception e) {
            log.error("Python 서버 통신 실패: {}", e.getMessage());
        }
        
        // 실패 시 기본 응답
        return CommandIntentResponse.builder()
                .intent(null)
                .confidence(0.0f)
                .processedLocally(false)
                .message("명령어 분석에 실패했습니다.")
                .build();
    }

    /**
     * TTS: 텍스트를 오디오로 변환
     * @param text 변환할 텍스트
     * @param voiceType 목소리 타입
     * @param speed 재생 속도
     * @param newsId 뉴스 ID (이어듣기 시 기존 파일 조회용, 선택적)
     */
    public byte[] generateSpeech(String text, String voiceType, Float speed, String newsId) {
        try {
            // "DEFAULT"를 "nova"로 변환 (안전장치)
            String validVoiceType = normalizeVoiceType(voiceType);
            
            // UriComponentsBuilder를 사용하여 자동 인코딩 처리 (이중 인코딩 방지)
            UriComponentsBuilder urlBuilder = UriComponentsBuilder.fromUriString(pythonServerUrl + "/api/drive/tts")
                    .queryParam("text", text)  // 자동으로 UTF-8 인코딩
                    .queryParam("voice_type", validVoiceType)
                    .queryParam("speed", speed);
            
            // newsId가 있으면 파라미터 추가
            if (newsId != null && !newsId.trim().isEmpty()) {
                urlBuilder.queryParam("news_id", newsId);
            }
            
            String url = urlBuilder.toUriString();
            
            log.info("TTS 요청 URL: {}", url);
            log.info("TTS 요청 텍스트: {}", text);
            log.info("TTS 요청 파라미터: voiceType={}, speed={}, newsId={}", validVoiceType, speed, newsId);
            
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);
            
            log.info("TTS 응답 상태 코드: {}", response.getStatusCode());
            log.info("TTS 응답 Body null 여부: {}", response.getBody() == null);
            if (response.getBody() != null) {
                log.info("TTS 응답 Body 크기: {} bytes", response.getBody().length);
            } else {
                log.error("TTS 응답 Body가 null입니다! 상태 코드: {}", response.getStatusCode());
            }
            
            // 응답 헤더 확인 (디버깅용)
            HttpHeaders headers = response.getHeaders();
            log.info("TTS 응답 Content-Type: {}", headers.getContentType());
            log.info("TTS 응답 Content-Length: {}", headers.getContentLength());
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                if (response.getBody().length == 0) {
                    log.error("TTS 응답 Body가 비어있습니다! (0 bytes)");
                } else {
                    log.info("TTS 생성 성공: {} bytes", response.getBody().length);
                    return response.getBody();
                }
            } else {
                log.warn("TTS 응답 실패: status={}, bodyNull={}, bodySize={}", 
                        response.getStatusCode(), 
                        response.getBody() == null,
                        response.getBody() != null ? response.getBody().length : 0);
            }
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.error("TTS 생성 실패 (Python 서버 연결 실패): {}", e.getMessage(), e);
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("TTS 생성 실패 (HTTP 4xx 에러): status={}, body={}", 
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            String errorBody = e.getResponseBodyAsString();
            log.error("TTS 생성 실패 (HTTP 5xx 에러): status={}, body={}", 
                    e.getStatusCode(), errorBody, e);
            // Python 서버 에러 메시지에서 상세 정보 추출
            if (errorBody != null && errorBody.contains("OpenAI")) {
                log.error("OpenAI API 관련 오류로 추정됩니다. Python 서버 로그를 확인해주세요.");
            }
        } catch (Exception e) {
            log.error("TTS 생성 실패 (예상치 못한 오류): {}", e.getMessage(), e);
        }
        
        log.warn("TTS 생성 실패로 빈 바이트 배열 반환");
        return new byte[0];
    }
    
    /**
     * voiceType을 OpenAI API가 인식하는 유효한 값으로 정규화
     * "DEFAULT" 또는 null이면 "nova"로 변환
     */
    private String normalizeVoiceType(String voiceType) {
        if (voiceType == null || voiceType.trim().isEmpty() || "DEFAULT".equalsIgnoreCase(voiceType)) {
            return "nova";
        }
        return voiceType.toLowerCase();
    }

    /**
     * Python 서버로 브리핑 스크립트 생성 요청
     */
    public Map<String, Object> generateBriefing(List<com.fullStc.drive.dto.NewsSummaryDto> newsQueue, Long userId) {
        try {
            String url = pythonServerUrl + "/api/drive/generate-briefing";
            
            // NewsSummaryDto를 Map으로 변환
            java.util.List<Map<String, Object>> newsList = new java.util.ArrayList<>();
            if (newsQueue != null) {
                for (com.fullStc.drive.dto.NewsSummaryDto news : newsQueue) {
                    Map<String, Object> newsMap = new HashMap<>();
                    newsMap.put("news_id", news.getNewsId());
                    newsMap.put("category", news.getCategory());
                    newsMap.put("summary_text", news.getSummaryText());
                    newsMap.put("is_hot", news.getIsHot());
                    newsList.add(newsMap);
                }
            }
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("news_list", newsList);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) 
                (ResponseEntity<?>) restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("브리핑 생성 실패: {}", e.getMessage());
        }
        
        // 실패 시 기본 응답
        Map<String, Object> defaultResponse = new HashMap<>();
        defaultResponse.put("script", "");
        return defaultResponse;
    }

    /**
     * STT: 오디오를 텍스트로 변환 (Python 서버 Whisper API)
     */
    public String transcribeAudio(MultipartFile audioFile, Long userId) {
        try {
            String url = pythonServerUrl + "/api/drive/stt";

            String originalFilename = audioFile.getOriginalFilename();
            String contentType = audioFile.getContentType();
            long size = audioFile.getSize();
            log.info("STT 요청 - 파일명: {}, Content-Type: {}, 크기: {} bytes", originalFilename, contentType, size);

            byte[] audioBytes = audioFile.getBytes();
            ByteArrayResource resource = new ByteArrayResource(audioBytes) {
                @Override
                public String getFilename() {
                    return originalFilename != null 
                        ? originalFilename 
                        : "audio.webm";
                }
            };
            
            // MultiValueMap 생성
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("audio", resource);
            body.add("user_id", userId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>)
                (ResponseEntity<?>) restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> bodyMap = response.getBody();
                String text = (String) bodyMap.get("text");
                log.info("STT 변환 성공: {}", text);
                return text;
            }
        } catch (Exception e) {
            log.error("STT 변환 실패: {}", e.getMessage(), e);
        }

        return null;
    }

    /**
     * Python 서버의 통합 명령 처리 엔드포인트 호출
     * 
     * 텍스트 → Intent 분석 → DJ 스크립트 생성 → TTS 생성
     * 
     * @param rawText 사용자 입력 텍스트
     * @param userId 사용자 ID
     * @param newsQueue 뉴스 큐 (선택적)
     */
    public VoiceCommandResponse processCommand(String rawText, Long userId, List<NewsSummaryDto> newsQueue) {
        try {
            String url = pythonServerUrl + "/api/drive/process-command";
            
            // NewsSummaryDto를 Map으로 변환
            List<Map<String, Object>> newsList = new ArrayList<>();
            if (newsQueue != null && !newsQueue.isEmpty()) {
                for (NewsSummaryDto news : newsQueue) {
                    Map<String, Object> newsMap = new HashMap<>();
                    newsMap.put("news_id", news.getNewsId() != null ? news.getNewsId() : "");
                    newsMap.put("category", news.getCategory() != null ? news.getCategory() : "일반");
                    newsMap.put("summary_text", news.getSummaryText() != null ? news.getSummaryText() : "");
                    // is_hot은 boolean으로 명시적 변환
                    newsMap.put("is_hot", news.getIsHot() != null ? news.getIsHot() : false);
                    newsList.add(newsMap);
                }
            }
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("raw_text", rawText != null ? rawText : "");
            requestBody.put("user_id", userId);
            requestBody.put("news_queue", newsList.isEmpty() ? null : newsList);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) 
                (ResponseEntity<?>) restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                
                // base64 오디오를 URL로 변환
                String audioUrl = null;
                String djScript = (String) body.get("dj_script");
                if (djScript != null && !djScript.trim().isEmpty()) {
                    // 설정 기능 제거: 기본값 사용 (voiceType="nova", speed=1.0)
                    String voiceType = "nova";
                    Float speed = 1.0f;
                    
                    // TTS URL 생성 (별도 엔드포인트로 제공)
                    audioUrl = "/api/drive/tts/script?text=" + 
                              java.net.URLEncoder.encode(djScript, java.nio.charset.StandardCharsets.UTF_8) +
                              "&voiceType=" + voiceType + "&speed=" + speed;
                }
                
                Object confidenceObj = body.get("confidence");
                Float confidence = confidenceObj != null 
                    ? ((Number) confidenceObj).floatValue() 
                    : 0.0f;
                
                return VoiceCommandResponse.builder()
                        .intent((String) body.get("intent"))
                        .confidence(confidence)
                        .djScript(djScript)
                        .audioUrl(audioUrl)
                        .processedLocally(false)
                        .message((String) body.get("message"))
                        .build();
            } else {
                log.warn("Python 서버 응답 실패: status={}", response.getStatusCode());
            }
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.error("Python 서버 연결 실패 (서버가 실행 중이지 않을 수 있음): {}", e.getMessage());
            return VoiceCommandResponse.builder()
                    .intent(null)
                    .confidence(0.0f)
                    .djScript(null)
                    .audioUrl(null)
                    .processedLocally(false)
                    .message("AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.")
                    .build();
        } catch (Exception e) {
            log.error("Python 서버 통합 명령 처리 실패: {}", e.getMessage(), e);
        }
        
        // 실패 시 기본 응답
        return VoiceCommandResponse.builder()
                .intent(null)
                .confidence(0.0f)
                .djScript(null)
                .audioUrl(null)
                .processedLocally(false)
                .message("명령 처리에 실패했습니다. 네트워크 오류가 발생했을 수 있습니다.")
                .build();
    }

    /**
     * 플레이리스트 전체 TTS 생성
     * @param newsList 뉴스 목록
     * @param historyId 히스토리 ID
     * @param voiceType 목소리 타입
     * @param speed 재생 속도
     * @return 오디오 바이너리 데이터
     */
    public byte[] generatePlaylistTTS(
            List<NewsItemDto> newsList,
            Long historyId,
            String voiceType,
            Float speed
    ) {
        try {
            String validVoiceType = normalizeVoiceType(voiceType);
            String url = pythonServerUrl + "/api/drive/tts/playlist";
            
            // NewsItemDto를 Map으로 변환
            List<Map<String, Object>> newsListMap = new ArrayList<>();
            if (newsList != null) {
                for (NewsItemDto news : newsList) {
                    Map<String, Object> newsMap = new HashMap<>();
                    newsMap.put("news_id", news.getNewsId());
                    newsMap.put("title", news.getTitle());
                    newsMap.put("category", news.getCategory());
                    newsMap.put("summary", news.getSummary());
                    newsListMap.add(newsMap);
                }
            }
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("news_list", newsListMap);
            requestBody.put("history_id", historyId);
            requestBody.put("voice_type", validVoiceType);
            requestBody.put("speed", speed);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<byte[]> response = restTemplate.postForEntity(url, request, byte[].class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("플레이리스트 TTS 생성 성공: historyId={}, 크기={} bytes", historyId, response.getBody().length);
                return response.getBody();
            } else {
                log.warn("플레이리스트 TTS 생성 실패: status={}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("플레이리스트 TTS 생성 실패: {}", e.getMessage(), e);
        }
        
        return new byte[0];
    }

    /**
     * TTS 파일 삭제 (히스토리 ID 기반)
     * @param historyId 히스토리 ID
     */
    public void deleteTTSFile(Long historyId) {
        try {
            String url = pythonServerUrl + "/api/drive/tts/history/" + historyId;
            restTemplate.delete(url);
            log.info("TTS 파일 삭제 성공: historyId={}", historyId);
        } catch (Exception e) {
            log.error("TTS 파일 삭제 실패: historyId={}, error={}", historyId, e.getMessage(), e);
            throw new RuntimeException("TTS 파일 삭제 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 고아 TTS 파일 정리 (히스토리가 없는 TTS 파일)
     * @return 삭제된 파일 개수
     */
    public int cleanupOrphanTTSFiles() {
        try {
            String url = pythonServerUrl + "/api/drive/tts/cleanup/orphan";
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) 
                (ResponseEntity<?>) restTemplate.postForEntity(url, null, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Object countObj = body.get("deleted_count");
                int deletedCount = countObj != null ? ((Number) countObj).intValue() : 0;
                log.info("고아 TTS 파일 정리 성공: 삭제된 파일 개수={}", deletedCount);
                return deletedCount;
            }
        } catch (Exception e) {
            log.error("고아 TTS 파일 정리 실패: error={}", e.getMessage(), e);
        }
        return 0;
    }
    
    /**
     * 히스토리 TTS 파일 조회
     * @param historyId 히스토리 ID
     * @return 오디오 바이너리 데이터
     */
    public byte[] getHistoryTTS(Long historyId) {
        try {
            String url = pythonServerUrl + "/api/drive/tts/history/" + historyId;
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("히스토리 TTS 조회 성공: historyId={}, 크기={} bytes", historyId, response.getBody().length);
                return response.getBody();
            } else {
                log.warn("히스토리 TTS 조회 실패: historyId={}, status={}", historyId, response.getStatusCode());
                return null;
            }
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() != null && e.getStatusCode().value() == 404) {
                log.debug("히스토리 TTS 캐시 없음(정상): historyId={}", historyId);
                return null;
            }
            log.warn("히스토리 TTS 조회 4xx: historyId={}, status={}", historyId, e.getStatusCode());
            return null;
        } catch (Exception e) {
            log.error("히스토리 TTS 조회 실패: historyId={}, error={}", historyId, e.getMessage(), e);
            return null;
        }
    }
}
