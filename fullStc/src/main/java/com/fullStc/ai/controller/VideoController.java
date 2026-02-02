package com.fullStc.ai.controller;

import com.fullStc.ai.dto.VideoTaskDTO;
import com.fullStc.ai.service.VideoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
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
}