package com.fullStc.ai.service;

import com.fullStc.ai.domain.VideoTask;
import com.fullStc.ai.dto.VideoTaskDTO;
import com.fullStc.ai.repository.VideoTaskRepository;
import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
@Log4j2
@RequiredArgsConstructor
@Transactional
public class VideoServiceImpl implements VideoService {

    private final VideoTaskRepository videoTaskRepository;
    private final MemberRepository memberRepository;

    /**
     * 영상 파일이 저장되는 디렉터리.
     * - 기준: 애플리케이션이 실행되는 현재 작업 디렉터리(user.dir)
     * - 구조: [프로젝트 루트]/python-ai/videos
     * → 다른 PC에서도 프로젝트 루트만 같으면 동일하게 동작
     */
    private final Path uploadDir = Paths.get(System.getProperty("user.dir"), "python-ai", "videos");

    @Override
    public void deleteVideo(Long vno) {
        log.info("영상 삭제 요청 vno: " + vno);

        // 1. 엔티티 조회
        VideoTask task = videoTaskRepository.findById(vno)
                .orElseThrow(() -> new RuntimeException("해당 영상을 찾을 수 없습니다."));

        // 2. 물리 파일 삭제 로직
        String fileName = task.getVideoUrl();
        if (fileName != null && !fileName.isEmpty()) {
            File file = uploadDir.resolve(fileName).toFile();
            if (file.exists()) {
                if (file.delete()) {
                    log.info("MP4 파일 삭제 성공: " + fileName);
                } else {
                    log.error("MP4 파일 삭제 실패: " + fileName);
                }
            }
        }

        // 3. DB 레코드 삭제
        videoTaskRepository.deleteById(vno);
    }

    @Override
    public Long requestVideoGeneration(VideoTaskDTO dto) {
        log.info("[영상 제작 요청] customTitle: {}", dto.getCustomTitle());

        // 기존 작업 취소
        List<VideoTask> activeTasks = videoTaskRepository.findByMemberIdAndStatusIn(
                dto.getMemberId(), List.of("PENDING", "PROCESSING"));

        if (!activeTasks.isEmpty()) {
            activeTasks.forEach(task -> task.changeStatus("CANCELED"));
            videoTaskRepository.saveAll(activeTasks);
        }

        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다."));

        // customTitle이 null이거나 빈 문자열인 경우 처리
        String customTitle = dto.getCustomTitle();
        if (customTitle != null && customTitle.trim().isEmpty()) {
            customTitle = null;
        } else if (customTitle != null) {
            customTitle = customTitle.trim();
        }

        VideoTask task = VideoTask.builder()
                .member(member)
                .newsId(dto.getNewsId())
                .rawText(dto.getRawText())
                .customTitle(customTitle)
                .category(dto.getCategory() != null ? dto.getCategory() : "politics")
                .videoMode(dto.getVideoMode())
                .status("PENDING")
                .isVipAuto(dto.isVipAuto())
                .isMainHot(dto.isMainHot())
                .build();

        Long vno = videoTaskRepository.save(task).getVno();
        log.info("[영상 제작 요청 완료] vno: {}, 저장된 customTitle: {}", vno, task.getCustomTitle());

        // 파이썬 연동
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> body = Map.of("vno", vno, "rawText", dto.getRawText(), "videoMode", dto.getVideoMode());
            restTemplate.postForEntity("http://localhost:8000/generate_video", body, String.class);
        } catch (Exception e) {
            log.error("파이썬 호출 실패: " + e.getMessage());
        }

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
            if (videoUrl != null || imgUrl != null)
                task.updateResult(videoUrl, imgUrl);
        });
    }

    private VideoTaskDTO entityToDTO(VideoTask entity) {
        return VideoTaskDTO.builder()
                .vno(entity.getVno())
                .memberId(entity.getMember() != null ? entity.getMember().getId() : null)
                .newsId(entity.getNewsId())
                .rawText(entity.getRawText())
                .customTitle(entity.getCustomTitle() != null && !entity.getCustomTitle().trim().isEmpty()
                        ? entity.getCustomTitle()
                        : null)
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