package com.fullStc.board.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fullStc.board.service.FileStorageService;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class FileController {
    private final FileStorageService fileStorageService;

    @GetMapping("/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        try {
            File file = fileStorageService.loadFile(fileName);
            if (file == null || !file.exists()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(file);
            String contentType = Files.probeContentType(Paths.get(file.getAbsolutePath()));
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            // 이미지 파일인 경우 inline으로, 그 외에는 attachment로 제공
            String disposition = contentType.startsWith("image/")
                ? "inline; filename=\"" + file.getName() + "\""
                : "attachment; filename=\"" + file.getName() + "\"";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/thumbnails/{fileName}")
    public ResponseEntity<Resource> downloadThumbnail(@PathVariable String fileName) {
        try {
            File thumbnail = fileStorageService.loadThumbnail(fileName);
            if (thumbnail == null || !thumbnail.exists()) {
                // 썸네일이 없으면 원본 파일 반환
                File originalFile = fileStorageService.loadFile(fileName);
                if (originalFile == null || !originalFile.exists()) {
                    return ResponseEntity.notFound().build();
                }
                Resource resource = new FileSystemResource(originalFile);
                String contentType = Files.probeContentType(Paths.get(originalFile.getAbsolutePath()));
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + originalFile.getName() + "\"")
                        .body(resource);
            }

            Resource resource = new FileSystemResource(thumbnail);
            String contentType = Files.probeContentType(Paths.get(thumbnail.getAbsolutePath()));
            if (contentType == null) {
                contentType = "image/jpeg";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + thumbnail.getName() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}

