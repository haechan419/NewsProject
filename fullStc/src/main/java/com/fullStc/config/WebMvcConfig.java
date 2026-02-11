package com.fullStc.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * WebMvcConfig - 정적 리소스 설정
 *
 * 주의: WebConfig.java에서 /upload/videos/** 경로를 이미 처리하고 있으므로,
 * 이 클래스는 다른 정적 리소스가 필요한 경우에만 사용하세요.
 * 현재는 비어있지만 향후 확장을 위해 유지합니다.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // WebConfig.java에서 /upload/videos/** 경로를 처리하므로
        // 여기서는 다른 정적 리소스가 필요한 경우에만 추가하세요.
        // 하드코딩된 절대 경로는 제거되었습니다.
    }
}