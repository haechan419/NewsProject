package com.fullStc.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 영상 파일 서빙을 위한 경로 매핑
        registry.addResourceHandler("/upload/**")
                .addResourceLocations("file:///D:/1teamnews/fullStc/upload/");
    }
}