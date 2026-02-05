package com.fullStc.config;

import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@Log4j2
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 프로젝트 루트 디렉토리 기준으로 상대 경로 계산
        String currentDir = System.getProperty("user.dir");
        Path currentPath = Paths.get(currentDir);
        Path videoPath = null;
        File videoDir = null;

        // 여러 가능한 경로를 시도
        Path[] possiblePaths = {
                // 1. 현재 디렉토리에서 직접 찾기
                currentPath.resolve("python-ai").resolve("videos"),
                // 2. 상위 디렉토리에서 찾기 (fullStc에서 실행하는 경우)
                currentPath.getParent() != null ? currentPath.getParent().resolve("python-ai").resolve("videos") : null,
                // 3. 상위의 상위 디렉토리에서 찾기
                currentPath.getParent() != null && currentPath.getParent().getParent() != null
                        ? currentPath.getParent().getParent().resolve("python-ai").resolve("videos")
                        : null
        };

        // 존재하는 경로 찾기
        for (Path testPath : possiblePaths) {
            if (testPath != null) {
                Path absolutePath = testPath.toAbsolutePath();
                File testDir = absolutePath.toFile();
                if (testDir.exists() && testDir.isDirectory()) {
                    videoPath = absolutePath;
                    videoDir = testDir;
                    log.info("[비디오 디렉토리 찾음] 경로: {}", videoPath);
                    break;
                }
            }
        }

        // 디렉토리를 찾지 못한 경우
        if (videoPath == null || videoDir == null) {
            log.error("[비디오 디렉토리 없음] 시도한 경로들:");
            for (Path testPath : possiblePaths) {
                if (testPath != null) {
                    log.error("  - {}", testPath.toAbsolutePath());
                }
            }
            log.error("현재 작업 디렉토리: {}", currentDir);
            return;
        }

        // Windows 경로 처리: file:/// 형식 사용
        // Windows에서는 file:///C:/path 형식이 필요함
        String resourceLocation;
        if (System.getProperty("os.name").toLowerCase().contains("windows")) {
            // Windows: file:///C:/path/to/videos/ 형식
            String windowsPath = videoPath.toString().replace("\\", "/");
            // C: 같은 드라이브 문자 뒤에 슬래시가 없으면 추가
            if (windowsPath.matches("^[A-Z]:[^/].*")) {
                windowsPath = windowsPath.replaceFirst("^([A-Z]:)([^/])", "$1/$2");
            }
            resourceLocation = "file:///" + windowsPath + "/";
        } else {
            // Linux/Mac: file:///path/to/videos/ 형식
            resourceLocation = "file://" + videoPath.toString() + "/";
        }

        // 비디오 파일 서빙 경로 매핑
        registry.addResourceHandler("/upload/videos/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(0); // 캐싱 비활성화 (개발 환경)

        log.info("=================================================");
        log.info("[비디오 리소스 설정 완료]");
        log.info("가상 경로: /upload/videos/**");
        log.info("실제 폴더: {}", resourceLocation);
        log.info("현재 작업 디렉토리: {}", currentDir);
        log.info("절대 경로: {}", videoPath);
        log.info("디렉토리 존재: {}", videoDir.exists());
        log.info("디렉토리 읽기 가능: {}", videoDir.canRead());
        if (videoDir.exists() && videoDir.isDirectory()) {
            File[] files = videoDir.listFiles();
            log.info("파일 개수: {}", files != null ? files.length : 0);
            if (files != null && files.length > 0) {
                log.info("첫 번째 파일: {}", files[0].getName());
            }
        }
        log.info("=================================================");
    }
}