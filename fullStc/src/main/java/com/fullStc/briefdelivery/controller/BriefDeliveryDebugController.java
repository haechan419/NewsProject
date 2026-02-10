package com.fullStc.briefdelivery.controller;

import com.fullStc.briefdelivery.dto.BriefDeliveryDebugStatusResponse;
import com.fullStc.briefdelivery.service.BriefDeliveryScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 브리핑 배송 디버그 API (dev 프로필에서만 활성화)
 * 예) http://localhost:8080/api/brief-delivery/debug/latest?userId=1
 */
@Profile("dev")
@RestController
@RequestMapping("/api/brief-delivery")
@RequiredArgsConstructor
public class BriefDeliveryDebugController {

    private final BriefDeliveryScheduleService scheduleService;

    @GetMapping("/debug/latest")
    public ResponseEntity<BriefDeliveryDebugStatusResponse> latestDebugStatus(@RequestParam Long userId) {
        BriefDeliveryDebugStatusResponse response = scheduleService.findLatestDebugStatus(userId);
        return ResponseEntity.ok(response);
    }
}
