package com.fullStc.briefdelivery.controller;

import com.fullStc.briefdelivery.dto.*;
import com.fullStc.briefdelivery.service.BriefDeliveryNluService;
import com.fullStc.briefdelivery.service.BriefDeliveryScheduleService;
import com.fullStc.briefdelivery.repository.BriefDeliveryScheduleRepository;
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

    private static final String INTENT_BRIEF_DELIVERY = "BRIEF_DELIVERY_SUBSCRIBE";

    private final VoiceProcessingService voiceProcessingService;
    private final BriefDeliveryNluService nluService;
    private final BriefDeliveryScheduleService scheduleService;
    private final BriefDeliveryScheduleRepository scheduleRepository;

    /**
     * 음성 분석: 오디오 → STT → NLU(의도·배송시간) → 의도가 맞으면 예약 등록
     */
    @PostMapping("/analyze-voice")
    public ResponseEntity<BriefDeliveryAnalyzeResponse> analyzeVoice(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("userId") Long userId) {
        try {
            String rawText = voiceProcessingService.transcribeAudio(audioFile, userId);
            if (rawText == null || rawText.trim().isEmpty()) {
                return ResponseEntity.ok(BriefDeliveryAnalyzeResponse.builder()
                        .intent(null)
                        .scheduledAt(null)
                        .message("음성을 인식하지 못했습니다. 다시 말씀해 주세요.")
                        .scheduled(false)
                        .build());
            }
            BriefDeliveryAnalyzeResponse response = nluService.analyze(rawText, userId);
            if (INTENT_BRIEF_DELIVERY.equals(response.getIntent()) && response.getScheduledAt() != null) {
                BriefDeliveryScheduleRequest request = BriefDeliveryScheduleRequest.builder()
                        .scheduledAt(response.getScheduledAt())
                        .build();
                scheduleService.register(userId, request);
                response.setScheduled(true);
                response.setMessage(response.getMessage() != null ? response.getMessage() : "예약이 완료되었습니다.");
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Brief delivery request rejected (voice): {}", e.getMessage());
            return ResponseEntity.ok(BriefDeliveryAnalyzeResponse.builder()
                    .intent(null)
                    .scheduledAt(null)
                    .message(e.getMessage())
                    .scheduled(false)
                    .build());
        } catch (Exception e) {
            log.error("Brief delivery analyze failed (voice): {}", e.getMessage(), e);
            return ResponseEntity.ok(BriefDeliveryAnalyzeResponse.builder()
                    .intent(null)
                    .scheduledAt(null)
                    .message("처리 중 오류가 발생했습니다.")
                    .scheduled(false)
                    .build());
        }
    }

    /**
     * 텍스트 분석: NLU(의도·배송시간) → 의도가 맞으면 예약 등록
     */
    @PostMapping("/analyze-text")
    public ResponseEntity<BriefDeliveryAnalyzeResponse> analyzeText(@Valid @RequestBody BriefDeliveryAnalyzeRequest request) {
        try {
            BriefDeliveryAnalyzeResponse response = nluService.analyze(request.getRawText(), request.getUserId());
            if (INTENT_BRIEF_DELIVERY.equals(response.getIntent()) && response.getScheduledAt() != null) {
                BriefDeliveryScheduleRequest scheduleRequest = BriefDeliveryScheduleRequest.builder()
                        .scheduledAt(response.getScheduledAt())
                        .build();
                scheduleService.register(request.getUserId(), scheduleRequest);
                response.setScheduled(true);
                response.setMessage(response.getMessage() != null ? response.getMessage() : "예약이 완료되었습니다.");
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Brief delivery request rejected (text): {}", e.getMessage());
            return ResponseEntity.ok(BriefDeliveryAnalyzeResponse.builder()
                    .intent(null)
                    .scheduledAt(null)
                    .message(e.getMessage())
                    .scheduled(false)
                    .build());
        } catch (Exception e) {
            log.error("Brief delivery analyze failed (text): {}", e.getMessage(), e);
            return ResponseEntity.ok(BriefDeliveryAnalyzeResponse.builder()
                    .intent(null)
                    .scheduledAt(null)
                    .message("처리 중 오류가 발생했습니다.")
                    .scheduled(false)
                    .build());
        }
    }

    /**
     * 사용자별 예약 목록 조회
     */
    @GetMapping("/schedules")
    public ResponseEntity<List<BriefDeliveryScheduleResponse>> listSchedules(@RequestParam Long userId) {
        List<BriefDeliveryScheduleResponse> list = scheduleService.findByUserId(userId);
        return ResponseEntity.ok(list);
    }

    /**
     * 브라우저에서 마지막 발송 상태를 확인하는 디버그 API
     * 예) http://localhost:8080/api/brief-delivery/debug/latest?userId=1
     */
    @GetMapping("/debug/latest")
    public ResponseEntity<BriefDeliveryDebugStatusResponse> latestDebugStatus(@RequestParam Long userId) {
        var latest = scheduleRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
        if (latest == null) {
            return ResponseEntity.ok(BriefDeliveryDebugStatusResponse.builder()
                    .scheduleId(null)
                    .userId(userId)
                    .status("NO_SCHEDULE")
                    .errorMessage("No brief delivery schedule found for this user.")
                    .build());
        }
        return ResponseEntity.ok(BriefDeliveryDebugStatusResponse.builder()
                .scheduleId(latest.getId())
                .userId(latest.getUserId())
                .scheduledAt(latest.getScheduledAt())
                .status(latest.getStatus())
                .createdAt(latest.getCreatedAt())
                .lastAttemptAt(latest.getLastAttemptAt())
                .completedAt(latest.getCompletedAt())
                .errorMessage(latest.getErrorMessage())
                .build());
    }
}
