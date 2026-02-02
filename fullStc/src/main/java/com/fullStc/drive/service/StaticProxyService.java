package com.fullStc.drive.service;

import org.springframework.http.ResponseEntity;

/**
 * Python 서버 정적 파일(/static/...) 프록시 서비스
 */
public interface StaticProxyService {
    ResponseEntity<byte[]> proxyStatic(String path);
}
