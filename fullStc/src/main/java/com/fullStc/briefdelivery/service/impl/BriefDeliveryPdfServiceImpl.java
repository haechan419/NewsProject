package com.fullStc.briefdelivery.service.impl;

import com.fullStc.briefdelivery.dto.BriefDeliveryPdfRequestDto;
import com.fullStc.briefdelivery.service.BriefDeliveryPdfService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Python PDF 생성 API 호출 구현
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BriefDeliveryPdfServiceImpl implements BriefDeliveryPdfService {

    @Value("${python.server.url:http://localhost:8000}")
    private String pythonServerUrl;

    @Qualifier("driveRestTemplate")
    private final RestTemplate restTemplate;

    @Override
    public byte[] generatePdf(BriefDeliveryPdfRequestDto request) {
        try {
            String url = pythonServerUrl + "/api/brief-delivery/generate-pdf";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<BriefDeliveryPdfRequestDto> entity = new HttpEntity<>(request, headers);
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    byte[].class
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Brief delivery PDF generated: bytes={}", response.getBody().length);
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Brief delivery PDF generation call failed: {}", e.getMessage(), e);
        }
        return new byte[0];
    }
}
