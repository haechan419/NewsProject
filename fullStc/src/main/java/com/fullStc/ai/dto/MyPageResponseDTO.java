package com.fullStc.ai.dto;
<<<<<<< HEAD

import com.fullStc.scrap.dto.ScrapItemDto;
import lombok.Builder;
import lombok.Data;

=======
import lombok.Builder;
import lombok.Data;
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
import java.util.List;

@Data
@Builder
public class MyPageResponseDTO {
    private List<VideoTaskDTO> myVideos;   // 내가 생성한 영상들
<<<<<<< HEAD
    private List<String> scrapNewsIds;       // 내가 스크랩한 뉴스 ID 리스트 (호환용)
    private List<ScrapItemDto> scrapItems;  // 스크랩 카드 표시용 (제목·썸네일·URL 등)
=======
    private List<String> scrapNewsIds;       // 내가 스크랩한 뉴스 ID 리스트
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    private String interestCategories;       // 설정된 관심사 (IT, 경제 등)
    private boolean isVip;                   // VIP 여부
}