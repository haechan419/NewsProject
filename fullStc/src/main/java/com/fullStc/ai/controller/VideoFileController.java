package com.fullStc.ai.controller;

import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/python-ai/videos")
@Log4j2
@CrossOrigin(origins = "http://localhost:5173")
public class VideoFileController {

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> serveVideo(@PathVariable String fileName) {
        try {
            // 프로젝트 루트 디렉토리 기준으로 상대 경로 계산
            String currentDir = System.getProperty("user.dir");
            Path currentPath = Paths.get(currentDir);
            Path videoPath = null;
            File videoFile = null;

            log.info("비디오 파일 요청: {}", fileName);
            log.info("현재 작업 디렉토리: {}", currentDir);

            // 여러 가능한 경로를 시도
            Path[] possiblePaths = {
                    // 1. 현재 디렉토리에서 직접 찾기
                    currentPath.resolve("python-ai").resolve("videos").resolve(fileName),
                    // 2. 상위 디렉토리에서 찾기 (fullStc에서 실행하는 경우)
                    currentPath.getParent() != null
                            ? currentPath.getParent().resolve("python-ai").resolve("videos").resolve(fileName)
                            : null,
                    // 3. 상위의 상위 디렉토리에서 찾기
                    currentPath.getParent() != null && currentPath.getParent().getParent() != null
                            ? currentPath.getParent().getParent().resolve("python-ai").resolve("videos")
                                    .resolve(fileName)
                            : null
            };

            // 존재하는 경로 찾기
            for (Path testPath : possiblePaths) {
                if (testPath != null) {
                    Path absolutePath = testPath.toAbsolutePath();
                    File testFile = absolutePath.toFile();
                    if (testFile.exists() && testFile.isFile()) {
                        videoPath = absolutePath;
                        videoFile = testFile;
                        log.info("[비디오 파일 찾음] 경로: {}", videoPath);
                        break;
                    }
                }
            }

            // 파일을 찾지 못한 경우
            if (videoPath == null || videoFile == null) {
                log.error("[비디오 파일을 찾을 수 없습니다] 시도한 경로들:");
                for (Path testPath : possiblePaths) {
                    if (testPath != null) {
                        log.error("  - {}", testPath.toAbsolutePath());
                    }
                }
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(videoFile);
            String contentType = Files.probeContentType(videoPath);
            if (contentType == null) {
                contentType = "video/mp4"; // 기본값
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes") // 비디오 스트리밍 지원
                    .body(resource);
        } catch (Exception e) {
            log.error("비디오 파일 서빙 실패: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
