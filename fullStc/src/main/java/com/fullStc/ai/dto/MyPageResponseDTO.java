package com.fullStc.ai.dto;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class MyPageResponseDTO {
    private List<VideoTaskDTO> myVideos;   // 내가 생성한 영상들
    private List<String> scrapNewsIds;       // 내가 스크랩한 뉴스 ID 리스트
    private String interestCategories;       // 설정된 관심사 (IT, 경제 등)
    private boolean isVip;                   // VIP 여부
}