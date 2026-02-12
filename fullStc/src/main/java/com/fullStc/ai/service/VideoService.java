package com.fullStc.ai.service;

import com.fullStc.ai.dto.VideoTaskDTO;
import java.util.List;

public interface VideoService {
    // 사용자의 영상 생성 요청 처리
    Long requestVideoGeneration(VideoTaskDTO dto);

    // 특정 회원의 생성 완료된 영상 목록 조회
    List<VideoTaskDTO> getMemberVideoList(Long memberId);

    // 메인 페이지 노출용 핫이슈 영상 목록 조회
    List<VideoTaskDTO> getMainHotVideoList();

    // 영상 작업 상태 업데이트 (Python 엔진 연동용)
    void updateVideoStatus(Long vno, String status, String videoUrl, String imgUrl);

    // 영상 작업 삭제
    void deleteVideo(Long vno);

    // 모든 PROCESSING 작업 취소 (스케줄러용)
    void cancelAllProcessingTasks();
}