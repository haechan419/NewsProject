package com.fullStc.board.service;

import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 파일 저장 서비스
 * 파일 업로드, 썸네일 생성, 파일 로드 및 삭제 기능을 제공하는 서비스
 */
@Service
@Slf4j
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir; // 파일 업로드 디렉토리 경로

    @Value("${file.thumbnail-dir}")
    private String thumbnailDir; // 썸네일 저장 디렉토리 경로

    @Value("${file.thumbnail-width}")
    private int thumbnailWidth; // 썸네일 가로 크기

    @Value("${file.thumbnail-height}")
    private int thumbnailHeight; // 썸네일 세로 크기

    /**
     * 파일 저장 디렉토리 초기화
     * 업로드 디렉토리와 썸네일 디렉토리를 생성합니다.
     */
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
            Files.createDirectories(Paths.get(thumbnailDir));
        } catch (IOException e) {
            throw new RuntimeException("파일 저장 디렉토리를 생성할 수 없습니다.", e);
        }
    }

    /**
     * 단일 파일 저장
     * @param file 업로드할 파일
     * @return 저장된 파일 정보 (FileInfo)
     */
    public FileInfo storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            return null;
        }

        try {
            init();

            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String storedFileName = UUID.randomUUID().toString() + extension;
            Path targetLocation = Paths.get(uploadDir).resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String thumbnailPath = null;
            if (isImageFile(extension)) {
                thumbnailPath = createThumbnail(storedFileName, extension);
            }

            return FileInfo.builder()
                    .originalFileName(originalFileName)
                    .storedFileName(storedFileName)
                    .filePath(targetLocation.toString())
                    .fileSize(file.getSize())
                    .fileType(file.getContentType())
                    .thumbnailPath(thumbnailPath)
                    .build();
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", e.getMessage());
            throw new RuntimeException("파일 저장에 실패했습니다.", e);
        }
    }

    /**
     * 여러 파일 저장
     * @param files 업로드할 파일 배열
     * @return 저장된 파일 정보 목록
     */
    public List<FileInfo> storeFiles(MultipartFile[] files) {
        List<FileInfo> fileInfos = new ArrayList<>();
        if (files == null || files.length == 0) {
            return fileInfos;
        }

        for (MultipartFile file : files) {
            if (!file.isEmpty()) {
                FileInfo fileInfo = storeFile(file);
                if (fileInfo != null) {
                    fileInfos.add(fileInfo);
                }
            }
        }

        return fileInfos;
    }

    /**
     * 이미지 파일 여부 확인
     * @param extension 파일 확장자
     * @return 이미지 파일이면 true, 아니면 false
     */
    private boolean isImageFile(String extension) {
        if (extension == null) {
            return false;
        }
        String lowerExt = extension.toLowerCase();
        return lowerExt.equals(".jpg") || lowerExt.equals(".jpeg") || 
               lowerExt.equals(".png") || lowerExt.equals(".gif") || 
               lowerExt.equals(".bmp") || lowerExt.equals(".webp");
    }

    /**
     * 썸네일 생성
     * @param storedFileName 저장된 파일명
     * @param extension 파일 확장자
     * @return 생성된 썸네일 파일 경로
     */
    private String createThumbnail(String storedFileName, String extension) {
        try {
            String thumbnailFileName = "s_" + storedFileName;
            Path thumbnailPath = Paths.get(thumbnailDir).resolve(thumbnailFileName);
            Path originalPath = Paths.get(uploadDir).resolve(storedFileName);

            Thumbnails.of(originalPath.toFile())
                    .size(thumbnailWidth, thumbnailHeight)
                    .outputFormat(extension.substring(1))
                    .toFile(thumbnailPath.toFile());

            return thumbnailPath.toString();
        } catch (IOException e) {
            log.error("썸네일 생성 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 파일 로드
     * @param fileName 파일명
     * @return 파일 객체 (존재하지 않으면 null)
     */
    public File loadFile(String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName).normalize();
            File file = filePath.toFile();
            if (file.exists()) {
                return file;
            }
            return null;
        } catch (Exception e) {
            log.error("파일 로드 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 썸네일 파일 로드
     * @param fileName 원본 파일명
     * @return 썸네일 파일 객체 (존재하지 않으면 null)
     */
    public File loadThumbnail(String fileName) {
        try {
            String thumbnailFileName = "s_" + fileName;
            Path thumbnailPath = Paths.get(thumbnailDir).resolve(thumbnailFileName).normalize();
            File thumbnail = thumbnailPath.toFile();
            if (thumbnail.exists()) {
                return thumbnail;
            }
            return null;
        } catch (Exception e) {
            log.error("썸네일 로드 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 파일 삭제
     * 원본 파일과 썸네일 파일을 모두 삭제합니다.
     * @param fileName 삭제할 파일명
     */
    public void deleteFile(String fileName) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(fileName);
            Files.deleteIfExists(filePath);

            String thumbnailFileName = "s_" + fileName;
            Path thumbnailPath = Paths.get(thumbnailDir).resolve(thumbnailFileName);
            Files.deleteIfExists(thumbnailPath);
        } catch (IOException e) {
            log.error("파일 삭제 실패: {}", e.getMessage());
        }
    }

    /**
     * 파일 정보 DTO
     * 저장된 파일의 메타데이터를 담는 내부 클래스
     */
    @lombok.Builder
    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class FileInfo {
        private String originalFileName; // 원본 파일명
        private String storedFileName; // 저장된 파일명 (UUID)
        private String filePath; // 파일 저장 경로
        private Long fileSize; // 파일 크기
        private String fileType; // 파일 타입 (MIME type)
        private String thumbnailPath; // 썸네일 파일 경로
    }
}



