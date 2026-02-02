package com.fullStc.ai.controller;

import com.fullStc.ai.dto.FaceRegisterRequestDTO;
import com.fullStc.ai.dto.FaceRegisterResponseDTO;
import com.fullStc.ai.dto.FaceRecognitionRequestDTO;
import com.fullStc.ai.dto.FaceRecognitionResponseDTO;
import com.fullStc.ai.service.AiFaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * AI 얼굴 인식 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/ai/face")
@RequiredArgsConstructor
@Tag(name = "AI Face Recognition", description = "AI 얼굴 인식 API")
public class AiFaceController {
    
    private final AiFaceService aiFaceService;
    
    /**
     * 얼굴 등록
     */
    @Operation(summary = "얼굴 등록", description = "사용자의 얼굴을 등록합니다.")
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerFace(@RequestBody FaceRegisterRequestDTO requestDTO) {
        log.info("얼굴 등록 요청 - user_id: {}", requestDTO.getUserId());
        
        try {
            FaceRegisterResponseDTO responseDTO = aiFaceService.registerFace(requestDTO);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", responseDTO.isSuccess());
            response.put("data", responseDTO);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("얼굴 등록 에러: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * 얼굴 인식
     */
    @Operation(summary = "얼굴 인식", description = "이미지에서 얼굴을 인식하고 등록된 얼굴과 비교합니다.")
    @PostMapping("/recognize")
    public ResponseEntity<Map<String, Object>> recognizeFace(@RequestBody FaceRecognitionRequestDTO requestDTO) {
        log.info("얼굴 인식 요청 수신");
        
        try {
            FaceRecognitionResponseDTO responseDTO = aiFaceService.recognizeFace(requestDTO);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", responseDTO.isSuccess());
            response.put("data", responseDTO);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("얼굴 인식 에러: {}", e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
