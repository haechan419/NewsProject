package com.fullStc.drive.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class StaticProxyServiceImpl implements StaticProxyService {

    @Value("${python.server.url:http://localhost:8000}")
    private String pythonServerUrl;

    @Qualifier("driveRestTemplate")
    private final RestTemplate restTemplate;

    @Override
    public ResponseEntity<byte[]> proxyStatic(String path) {
        String url = pythonServerUrl + path;
        try {
            ResponseEntity<byte[]> pythonResponse =
                    restTemplate.exchange(url, HttpMethod.GET, HttpEntity.EMPTY, byte[].class);

            HttpHeaders headers = new HttpHeaders();
            MediaType contentType = pythonResponse.getHeaders().getContentType();
            if (contentType != null) {
                headers.setContentType(contentType);
            }
            String cacheControl = pythonResponse.getHeaders().getCacheControl();
            if (cacheControl != null && !cacheControl.isBlank()) {
                headers.setCacheControl(cacheControl);
            }

            return new ResponseEntity<>(pythonResponse.getBody(), headers, pythonResponse.getStatusCode());
        } catch (Exception e) {
            log.error("Python static 프록시 실패: url={}, err={}", url, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
