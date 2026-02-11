package com.fullStc.ai.controller;

import com.fullStc.ai.dto.VideoTaskDTO;
import com.fullStc.ai.service.VideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ai/video")
@Log4j2
@RequiredArgsConstructor
public class VideoController {

    private final VideoService videoService;

    @PostMapping("/request")
    public Long requestVideo(@RequestBody VideoTaskDTO dto) {
        return videoService.requestVideoGeneration(dto);
    }

    @GetMapping("/list/{memberId}")
    public List<VideoTaskDTO> getVideoList(@PathVariable("memberId") Long memberId) {
        return videoService.getMemberVideoList(memberId);
    }
    // VideoController.java
    @GetMapping("/main-hot")
    public List<VideoTaskDTO> getMainHotVideos() {
        return videoService.getMainHotVideoList();
}
@DeleteMapping("/delete/{vno}")
    public ResponseEntity<String> deleteVideo(@PathVariable("vno") Long vno) {
        log.info("비디오 삭제 요청 vno: " + vno);
        try {
            videoService.deleteVideo(vno);
            return ResponseEntity.ok("정상적으로 삭제되었습니다.");
        } catch (Exception e) {
            log.error("삭제 중 오류 발생: " + e.getMessage());
            return ResponseEntity.internalServerError().body("삭제 실패: " + e.getMessage());
        }
    }
}