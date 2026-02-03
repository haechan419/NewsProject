package com.fullStc.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 설정
 * Python FastAPI 서버와 통신에 사용
 */
@Configuration
public class RestTemplateConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        // 연결 타임아웃: 10초
        factory.setConnectTimeout(10000);
        
        // 읽기 타임아웃: 30초 (AI 응답 대기)
        factory.setReadTimeout(600000);
        
        return new RestTemplate(factory);
    }
}
