package com.fullStc.ai.service;

import com.fullStc.ai.domain.VideoTask; // SNVideoTask -> VideoTask 이름 변경 반영
import com.fullStc.ai.domain.MemberConfig;
import com.fullStc.ai.domain.Scrap;
import com.fullStc.ai.dto.MyPageResponseDTO;
import com.fullStc.ai.dto.VideoTaskDTO; // SNVideoTaskDTO -> VideoTaskDTO 이름 변경 반영
import com.fullStc.ai.repository.VideoTaskRepository; // SNVideoTaskRepository -> VideoTaskRepository 이름 변경 반영
import com.fullStc.ai.repository.MemberConfigRepository;
import com.fullStc.ai.repository.ScrapRepository;
<<<<<<< HEAD
import com.fullStc.scrap.dto.ScrapItemDto;
import com.fullStc.scrap.service.ScrapService;
=======
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
import lombok.RequiredArgsConstructor; // 빨간 줄 방지를 위한 필수 임포트
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Log4j2
@RequiredArgsConstructor // Lombok 라이브러리 정상 작동 확인 필요
@Transactional
public class MyPageServiceImpl implements MyPageService {

    private final VideoTaskRepository videoTaskRepository; // 변수명 수정
    private final ScrapRepository scrapRepository;
    private final MemberConfigRepository memberConfigRepository;
<<<<<<< HEAD
    private final ScrapService scrapService;
=======
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163

    @Override
    @Transactional(readOnly = true)
    public MyPageResponseDTO getMyPageData(Long memberId) {
        
        // 1. 내가 생성한 영상 목록 가져오기 (최신순)
        // VideoTask 엔티티가 Member 객체를 가지므로 쿼리 메서드가 이에 맞춰 작동합니다.
        List<VideoTaskDTO> videoList = videoTaskRepository.findByMemberIdOrderByRegDateDesc(memberId)
                .stream()
                .map(this::entityToDTO)
                .collect(Collectors.toList());

        // 2. 내가 스크랩한 뉴스 ID 리스트 가져오기
        List<String> scrapIds = scrapRepository.findByMemberId(memberId)
                .stream()
                .map(Scrap::getNewsId)
                .collect(Collectors.toList());
<<<<<<< HEAD
        List<ScrapItemDto> scrapItems = scrapService.getScrapItems(memberId);
=======
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163

        // 3. 개인 설정 정보 가져오기 (없으면 기본값 생성)
        MemberConfig config = memberConfigRepository.findById(memberId)
                .orElseGet(() -> MemberConfig.builder().memberId(memberId).build());

        // 4. 통합 DTO로 조립하여 반환
        return MyPageResponseDTO.builder()
                .myVideos(videoList)
                .scrapNewsIds(scrapIds)
<<<<<<< HEAD
                .scrapItems(scrapItems)
=======
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
                .interestCategories(config.getInterestCategories())
                .isVip(config.isVip())
                .build();
    }

    @Override
    public void toggleScrap(Long memberId, String newsId) {
<<<<<<< HEAD
        scrapService.toggleScrap(memberId, newsId);
=======
        scrapRepository.findByMemberIdAndNewsId(memberId, newsId)
                .ifPresentOrElse(
                    scrapRepository::delete,
                    () -> scrapRepository.save(Scrap.builder().memberId(memberId).newsId(newsId).build())
                );
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    }

    // 변환 보조 메서드: VideoTask 엔티티 구조 변경을 반영했습니다.
    private VideoTaskDTO entityToDTO(VideoTask entity) {
        return VideoTaskDTO.builder()
                .vno(entity.getVno())
                .memberId(entity.getMember().getId()) // 중요: entity.getMember().getId()로 변경
                .newsId(entity.getNewsId())
                .videoMode(entity.getVideoMode())
                .status(entity.getStatus())
                .videoUrl(entity.getVideoUrl())
                .imgUrl(entity.getImgUrl())
                .regDate(entity.getRegDate())
                .build();
    }
}