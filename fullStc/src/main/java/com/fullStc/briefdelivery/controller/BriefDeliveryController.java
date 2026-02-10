package com.fullStc.briefdelivery.controller;

import com.fullStc.briefdelivery.dto.*;
import com.fullStc.briefdelivery.service.BriefDeliveryScheduleService;
import com.fullStc.drive.service.VoiceProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 브리핑 배송(아침 신문 메일) 예약 API
 */
@Slf4j
@RestController
@RequestMapping("/api/brief-delivery")
@RequiredArgsConstructor
public class BriefDeliveryController {

    private final VoiceProcessingService voiceProcessingService;
    private final BriefDeliveryScheduleService scheduleService;

    /**
     * 음성 분석: 오디오 → STT → NLU(의도·배송시간) → 의도가 맞으면 예약 등록
     */
    @PostMapping("/analyze-voice")
    public ResponseEntity<BriefDeliveryAnalyzeResponse> analyzeVoice(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("userId") Long userId) {
        String rawText = voiceProcessingService.transcribeAudio(audioFile, userId);
        if (rawText == null || rawText.trim().isEmpty()) {
            return ResponseEntity.ok(BriefDeliveryAnalyzeResponse.builder()
                    .intent(null)
                    .scheduledAt(null)
                    .message("음성을 인식하지 못했습니다. 다시 말씀해 주세요.")
                    .scheduled(false)
                    .build());
        }
        BriefDeliveryAnalyzeResponse response = scheduleService.analyzeAndScheduleFromText(userId, rawText);
        return ResponseEntity.ok(response);
    }

    /**
     * 텍스트 분석: NLU(의도·배송시간) → 의도가 맞으면 예약 등록
     */
    @PostMapping("/analyze-text")
    public ResponseEntity<BriefDeliveryAnalyzeResponse> analyzeText(@Valid @RequestBody BriefDeliveryAnalyzeRequest request) {
        BriefDeliveryAnalyzeResponse response = scheduleService.analyzeAndScheduleFromText(
                request.getUserId(), request.getRawText());
        return ResponseEntity.ok(response);
    }

    /**
     * 사용자별 예약 목록 조회
     */
    @GetMapping("/schedules")
    public ResponseEntity<List<BriefDeliveryScheduleResponse>> listSchedules(@RequestParam Long userId) {
        List<BriefDeliveryScheduleResponse> list = scheduleService.findByUserId(userId);
        return ResponseEntity.ok(list);
    }
}
