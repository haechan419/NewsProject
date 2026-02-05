package com.fullStc.ai.service;

import com.fullStc.ai.domain.VideoTask;
import com.fullStc.ai.dto.VideoTaskDTO;
import com.fullStc.ai.repository.VideoTaskRepository;
import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.PageRequest; // ◀ 필수
import org.springframework.data.domain.Pageable;    // ◀ 필수
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class VideoServiceImpl implements VideoService {

    private final VideoTaskRepository videoTaskRepository;
    private final MemberRepository memberRepository;

    @Override
    public Long requestVideoGeneration(VideoTaskDTO dto) {
        // 기존 작업 취소
        List<VideoTask> activeTasks = videoTaskRepository.findByMemberIdAndStatusIn(
            dto.getMemberId(), List.of("PENDING", "PROCESSING")
        );
        
        if (!activeTasks.isEmpty()) {
            activeTasks.forEach(task -> task.changeStatus("CANCELED"));
            videoTaskRepository.saveAll(activeTasks);
        }

        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다."));

        VideoTask task = VideoTask.builder()
                .member(member)
                .newsId(dto.getNewsId())
                .rawText(dto.getRawText())
                .customTitle(dto.getCustomTitle())
                .category(dto.getCategory() != null ? dto.getCategory() : "politics")
                .videoMode(dto.getVideoMode())
                .status("PENDING")
                .isVipAuto(dto.isVipAuto())
                .isMainHot(dto.isMainHot())
                .build();

        Long vno = videoTaskRepository.save(task).getVno();

        // 파이썬 연동
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> body = Map.of("vno", vno, "rawText", dto.getRawText(), "videoMode", dto.getVideoMode());
            restTemplate.postForEntity("http://localhost:8000/generate_video", body, String.class);
        } catch (Exception e) { log.error("파이썬 호출 실패: " + e.getMessage()); }

        return vno;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VideoTaskDTO> getMemberVideoList(Long memberId) {
        return videoTaskRepository.findByMemberIdOrderByRegDateDesc(memberId)
                .stream().map(this::entityToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VideoTaskDTO> getMainHotVideoList() {
        // ✅ PageRequest를 사용하여 리포지토리 호출
        Pageable pageable = PageRequest.of(0, 10);
        return videoTaskRepository.findMainHotVideos("COMPLETED", pageable)
                .stream().map(this::entityToDTO).collect(Collectors.toList());
    }

    @Override
    public void updateVideoStatus(Long vno, String status, String videoUrl, String imgUrl) {
        videoTaskRepository.findById(vno).ifPresent(task -> {
            task.changeStatus(status);
            if (videoUrl != null || imgUrl != null) task.updateResult(videoUrl, imgUrl);
        });
    }

    private VideoTaskDTO entityToDTO(VideoTask entity) {
        return VideoTaskDTO.builder()
                .vno(entity.getVno())
                .memberId(entity.getMember() != null ? entity.getMember().getId() : null)
                .newsId(entity.getNewsId())
                .rawText(entity.getRawText())
                .customTitle(entity.getCustomTitle())
                .category(entity.getCategory() != null ? entity.getCategory() : "politics")
                .videoMode(entity.getVideoMode())
                .status(entity.getStatus())
                .videoUrl(entity.getVideoUrl())
                .imgUrl(entity.getImgUrl())
                .isVipAuto(entity.isVipAuto())
                .isMainHot(entity.isMainHot())
                .regDate(entity.getRegDate())
                .modDate(entity.getModDate())
                .build();
    }
}