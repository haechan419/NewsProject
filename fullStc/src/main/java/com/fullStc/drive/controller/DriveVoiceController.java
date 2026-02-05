package com.fullStc.drive.controller;

import com.fullStc.drive.dto.*;
import com.fullStc.drive.service.DriveModeService;
import com.fullStc.drive.service.VoiceProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/drive/voice")
@RequiredArgsConstructor
public class DriveVoiceController {

    private final DriveModeService driveModeService;
    private final VoiceProcessingService voiceProcessingService;

    /**
     * 텍스트 기반 통합 명령 처리
     * 
     * 텍스트 → Intent 분석 → DJ 스크립트 생성 → TTS 생성
     * Swagger 테스트용 엔드포인트
     */
    @PostMapping("/text-command")
    public ResponseEntity<VoiceCommandResponse> processTextCommand(@Valid @RequestBody TextCommandRequest request) {
        try {
            String text = request.getText();
            Long userId = request.getUserId();
            List<NewsSummaryDto> newsQueue = request.getNewsQueue();
            
            // 1단계: Java 로컬 필터링
            CommandIntentResponse intentResponse = driveModeService.analyzeCommand(text, userId);
            
            // 2단계: 단순 제어 명령인지 확인
            List<String> simpleCommands = Arrays.asList("NEXT", "PREV", "PAUSE", "RESUME", "STOP", "SAVE",
                    "VOLUME_UP", "VOLUME_DOWN", "SPEED_UP", "SPEED_DOWN", "REPEAT", "SKIP");
            boolean isSimpleCommand = intentResponse.getProcessedLocally() 
                    && intentResponse.getIntent() != null 
                    && simpleCommands.contains(intentResponse.getIntent());
            
            // 3단계: 단순 명령은 무조건 로컬 처리 (newsQueue 무시)
            if (isSimpleCommand) {
                return ResponseEntity.ok(VoiceCommandResponse.builder()
                        .intent(intentResponse.getIntent())
                        .confidence(intentResponse.getConfidence())
                        .djScript(null)
                        .audioUrl(null)
                        .processedLocally(true)
                        .message(intentResponse.getMessage())
                        .build());
            }
            
            // 4단계: 복잡한 명령 또는 뉴스 재생 명령은 Python 서버로
            // 설정 기능 제거: 기본값 사용 (voiceType="nova", speed=1.0)
            VoiceCommandResponse response = voiceProcessingService.processCommand(text, userId, newsQueue);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("텍스트 명령 처리 실패: {}", e.getMessage(), e);
            return ResponseEntity.ok(VoiceCommandResponse.builder()
                    .intent(null)
                    .confidence(0.0f)
                    .djScript(null)
                    .audioUrl(null)
                    .processedLocally(false)
                    .message("명령 처리 중 오류가 발생했습니다: " + e.getMessage())
                    .build());
        }
    }

    /**
     * 음성 명령 분석
     * 
     * 오디오 Blob을 받아 STT → Intent 분석 → 응답
     */
    @PostMapping("/analyze")
    public ResponseEntity<CommandIntentResponse> analyzeVoiceCommand(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("userId") Long userId) {
        try {
            // 1단계: STT (Python 서버로 오디오 전송)
            String rawText = voiceProcessingService.transcribeAudio(audioFile, userId);
            
            if (rawText == null || rawText.trim().isEmpty()) {
                return ResponseEntity.ok(CommandIntentResponse.builder()
                        .intent(null)
                        .confidence(0.0f)
                        .processedLocally(false)
                        .message("음성을 인식하지 못했습니다. 더 크게 말씀해주세요.")
                        .rawText(null) // STT 실패
                        .build());
            }
            
            log.info("STT 변환 결과: {}", rawText);
            
            // 2단계: Intent 분석 (기존 로직 재사용)
            CommandIntentResponse intentResponse = driveModeService.analyzeCommand(rawText, userId);
            // STT 결과(rawText)를 응답에 포함
            intentResponse.setRawText(rawText);
            
            // 3단계: 로컬에서 처리되지 않으면 Python 서버로 전달
            if (!intentResponse.getProcessedLocally() && intentResponse.getIntent() == null) {
                CommandIntentResponse complexResponse = voiceProcessingService.analyzeComplexCommand(rawText, userId);
                // STT 결과 유지
                complexResponse.setRawText(rawText);
                intentResponse = complexResponse;
            }
            
            return ResponseEntity.ok(intentResponse);
            
        } catch (Exception e) {
            log.error("음성 명령 분석 실패: {}", e.getMessage(), e);
            return ResponseEntity.ok(CommandIntentResponse.builder()
                    .intent(null)
                    .confidence(0.0f)
                    .processedLocally(false)
                    .message("명령 처리 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.")
                    .rawText(null)
                    .build());
        }
    }

    /**
     * 텍스트 기반 명령 분석 (기존 메서드 유지 - 호환성)
     */
    @PostMapping("/analyze-text")
    public ResponseEntity<CommandIntentResponse> analyzeCommandText(@Valid @RequestBody VoiceCommandRequest request) {
        // 1단계: Java 로컬 필터링
        CommandIntentResponse response = driveModeService.analyzeCommand(request.getRawText(), request.getUserId());
        
        // 2단계: 로컬에서 처리되지 않으면 Python 서버로 전달
        if (!response.getProcessedLocally() && response.getIntent() == null) {
            response = voiceProcessingService.analyzeComplexCommand(request.getRawText(), request.getUserId());
        }
        
        return ResponseEntity.ok(response);
    }
}
