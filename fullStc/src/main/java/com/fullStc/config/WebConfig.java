package com.fullStc.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String projectDir = System.getProperty("user.dir");

        Path videoPath = Paths.get(projectDir, "python-ai", "videos").toAbsolutePath();

        String resourceLocation = "file:///" + videoPath.toString().replace("\\", "/") + "/";


        registry.addResourceHandler("/upload/videos/**")
        .addResourceLocations("file:///C:/Users/EZEN/newsproject/python-ai/videos/");

        System.out.println("=================================================");
        System.out.println("✅ [비디오 리소스 설정 완료]");
        System.out.println("🚩 가상 경로: /upload/videos/**");
        System.out.println("📂 실제 폴더: " + resourceLocation);
        System.out.println("=================================================");
    }
}