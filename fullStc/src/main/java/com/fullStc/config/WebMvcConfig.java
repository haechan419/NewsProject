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
<<<<<<< HEAD
                .addResourceLocations("file:///D:/NewsProject-master/NewsProject-master/fullStc/upload/");
=======
                .addResourceLocations("file:///D:/1teamnews/fullStc/upload/");
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    }
}