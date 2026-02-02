package com.fullStc.drive.controller;

import com.fullStc.drive.service.StaticProxyService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Python(FastAPI) 정적 파일(/static/...)을 Java 서버(8080)에서 프록시합니다.
 *
 * 목적:
 * - 운영 환경에서 프론트가 8080 origin을 기준으로 /static/...을 요청할 때
 *   Python(8000)의 정적 오디오 파일을 동일 경로로 제공
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class DriveStaticProxyController {

    private final StaticProxyService staticProxyService;

    @GetMapping("/static/**")
    public ResponseEntity<byte[]> proxyStatic(HttpServletRequest request) {
        String path = request.getRequestURI();
        return staticProxyService.proxyStatic(path);
    }
}

