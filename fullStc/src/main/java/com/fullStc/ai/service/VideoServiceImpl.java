package com.fullStc.ai.service;

import com.fullStc.ai.domain.VideoTask;
import com.fullStc.ai.dto.VideoTaskDTO;
import com.fullStc.ai.repository.VideoTaskRepository;
import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate; // 파이썬 호출용
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

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
<<<<<<< HEAD
    public Long requestVideoGeneration(VideoTaskDTO dto) {
        boolean isRunning = videoTaskRepository.existsByMemberIdAndStatusIn(
        dto.getMemberId(), List.of("PENDING", "PROCESSING")
    );
    
    if (isRunning) {
        throw new RuntimeException("이미 제작 중인 영상이 있습니다. 잠시만 기다려주세요.");
    }
        log.info("--- 1. 영상 생성 요청 DB 등록 시작 ---");
        
        // 1. 회원 확인
        Member member = memberRepository.findById(dto.getMemberId())
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다."));

        // 2. DB에 PENDING(대기) 상태로 저장
        VideoTask task = VideoTask.builder()
                .member(member)
                .newsId(dto.getNewsId())
                .rawText(dto.getRawText())
                .customTitle(dto.getCustomTitle())
                .videoMode(dto.getVideoMode())
                .status("PENDING")
                .isVipAuto(dto.isVipAuto())
                .isMainHot(dto.isMainHot())
                .build();

        Long vno = videoTaskRepository.save(task).getVno();
        log.info("--- 2. DB 저장 완료 (vno: " + vno + ") ---");

        // ★ 3. 파이썬 서버 호출 (이 로직이 있어야 파이썬 로그가 찍힙니다!)
        try {
            RestTemplate restTemplate = new RestTemplate();
            // 파이썬 FastAPI 서버 주소 (엔드포인트 확인 필수)
            String pythonUrl = "http://localhost:8000/generate_video"; 

            // 파이썬에 전달할 데이터 구성
            Map<String, Object> requestBody = Map.of(
                "vno", vno,
                "rawText", dto.getRawText(),
                "videoMode", dto.getVideoMode()
            );

            log.info("--- 3. 파이썬 서버로 제작 요청 전송: " + pythonUrl + " ---");
            
            // 실제 호출 실행
            restTemplate.postForEntity(pythonUrl, requestBody, String.class);
            log.info("--- 4. 파이썬 서버 수신 확인 완료 ---");

        } catch (Exception e) {
            // 파이썬 서버가 꺼져있거나 통신 에러가 났을 경우
            log.error("!!! 파이썬 호출 실패 !!! : " + e.getMessage());
        }

        return vno;
    }

=======
public Long requestVideoGeneration(VideoTaskDTO dto) {
    // [수정] 1. 기존에 해당 회원이 요청해서 '대기 중'이거나 '제작 중'인 작업을 모두 취소 처리
    List<VideoTask> activeTasks = videoTaskRepository.findByMemberIdAndStatusIn(
        dto.getMemberId(), List.of("PENDING", "PROCESSING")
    );
    
    if (!activeTasks.isEmpty()) {
        log.info("--- 기존 미완료 작업 {}건을 취소(CANCELED) 처리합니다. ---", activeTasks.size());
        activeTasks.forEach(task -> task.changeStatus("CANCELED"));
        videoTaskRepository.saveAll(activeTasks);
        videoTaskRepository.flush(); // 즉시 DB 반영
    }

    log.info("--- 2. 새로운 영상 생성 요청 DB 등록 시작 ---");
    
    // 1. 회원 확인
    Member member = memberRepository.findById(dto.getMemberId())
            .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다."));

    // 2. DB에 PENDING 상태로 저장
    VideoTask task = VideoTask.builder()
            .member(member)
            .newsId(dto.getNewsId())
            .rawText(dto.getRawText())
            .customTitle(dto.getCustomTitle())
            .videoMode(dto.getVideoMode())
            .status("PENDING") // 새 작업은 항상 PENDING
            .isVipAuto(dto.isVipAuto())
            .isMainHot(dto.isMainHot())
            .build();

    Long vno = videoTaskRepository.save(task).getVno();
    log.info("--- 3. DB 저장 완료 (vno: " + vno + ") ---");

    // 3. 파이썬 서버 호출
    try {
        RestTemplate restTemplate = new RestTemplate();
        String pythonUrl = "http://localhost:8000/generate_video";
        Map<String, Object> requestBody = Map.of(
            "vno", vno,
            "rawText", dto.getRawText(),
            "videoMode", dto.getVideoMode()
        );
        restTemplate.postForEntity(pythonUrl, requestBody, String.class);
    } catch (Exception e) {
        log.error("!!! 파이썬 호출 실패 (서버 꺼짐 등) !!! : " + e.getMessage());
    }

    return vno;
}

>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    @Override
    @Transactional(readOnly = true)
    public List<VideoTaskDTO> getMemberVideoList(Long memberId) {
        return videoTaskRepository.findByMemberIdAndStatusInOrderByRegDateDesc(
            memberId, List.of("COMPLETED", "PROCESSING")
    )
    .stream()
    .map(this::entityToDTO)
    .collect(Collectors.toList());
}
    @Override
    public void updateVideoStatus(Long vno, String status, String videoUrl, String imgUrl) {
        videoTaskRepository.findById(vno).ifPresent(task -> {
            task.changeStatus(status);
            if (videoUrl != null || imgUrl != null) {
                task.updateResult(videoUrl, imgUrl);
            }
        });
    }

    private VideoTaskDTO entityToDTO(VideoTask entity) {
        return VideoTaskDTO.builder()
                .vno(entity.getVno())
                .memberId(entity.getMember().getId())
                .newsId(entity.getNewsId())
                .rawText(entity.getRawText())
                .customTitle(entity.getCustomTitle())
                .videoMode(entity.getVideoMode())
                .status(entity.getStatus())
                .videoUrl(entity.getVideoUrl())
                .imgUrl(entity.getImgUrl())
                .regDate(entity.getRegDate())
                .modDate(entity.getModDate())
                .build();
    }
}