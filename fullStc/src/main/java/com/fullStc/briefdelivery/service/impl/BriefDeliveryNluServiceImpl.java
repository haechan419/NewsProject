package com.fullStc.briefdelivery.service.impl;

import com.fullStc.briefdelivery.dto.BriefDeliveryAnalyzeResponse;
import com.fullStc.briefdelivery.service.BriefDeliveryNluService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Python 브리핑 배송 NLU API 호출 구현
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BriefDeliveryNluServiceImpl implements BriefDeliveryNluService {

    @Value("${python.server.url:http://localhost:8000}")
    private String pythonServerUrl;

    @Qualifier("driveRestTemplate")
    private final RestTemplate restTemplate;

    @Override
    public BriefDeliveryAnalyzeResponse analyze(String rawText, Long userId) {
        try {
            String url = pythonServerUrl + "/api/brief-delivery/analyze";
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("raw_text", rawText != null ? rawText : "");
            requestBody.put("user_id", userId != null ? userId : 0L);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>)
                    (ResponseEntity<?>) restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String intent = (String) body.get("intent");
                String message = (String) body.get("message");
                Object scheduledAtObj = body.get("scheduled_at");
                Instant scheduledAt = null;
                if (scheduledAtObj != null && !"".equals(scheduledAtObj.toString())) {
                    try {
                        scheduledAt = Instant.parse(scheduledAtObj.toString());
                    } catch (Exception e) {
                        log.warn("scheduled_at 파싱 실패: {}", scheduledAtObj);
                    }
                }
                return BriefDeliveryAnalyzeResponse.builder()
                        .intent(intent)
                        .scheduledAt(scheduledAt)
                        .message(message != null ? message : "")
                        .scheduled(false)
                        .build();
            }
        } catch (HttpStatusCodeException e) {
            log.error("브리핑 배송 NLU 호출 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("브리핑 배송 NLU 호출 실패: {} (Python 서버 실행 여부·python.server.url 확인)", e.getMessage(), e);
        }
        return BriefDeliveryAnalyzeResponse.builder()
                .intent(null)
                .scheduledAt(null)
                .message("의도 분석에 실패했습니다.")
                .scheduled(false)
                .build();
    }
}
