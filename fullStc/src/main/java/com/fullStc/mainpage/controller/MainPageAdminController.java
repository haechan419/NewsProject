package com.fullStc.mainpage.controller;

import com.fullStc.mainpage.service.MainPageNewsSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 메인페이지 관리자용 컨트롤러
 * News 데이터를 MainPageNews로 동기화하는 API
 */
@RestController
@RequestMapping("/api/mainpage/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class MainPageAdminController {

    private final MainPageNewsSyncService mainPageNewsSyncService;

    /**
     * News -> MainPageNews 수동 동기화
     */
    @PostMapping("/sync")
    public ResponseEntity<Map<String, String>> syncNews() {
        try {
            mainPageNewsSyncService.syncNewsToMainPage();
            return ResponseEntity.ok(Map.of("message", "동기화 완료"));
        } catch (Exception e) {
            log.error("뉴스 동기화 실패", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "동기화 실패: " + e.getMessage()));
        }
    }
}
