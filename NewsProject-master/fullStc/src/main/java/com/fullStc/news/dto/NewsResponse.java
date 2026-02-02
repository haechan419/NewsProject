package com.fullStc.news.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class NewsResponse {
    private String category;
    private String query;
    private List<UnifiedArticle> items;

    // ★ 추가: 내부 파이프라인 전달용 ID 목록
    // @JsonIgnore 덕분에 프론트엔드(JSON)에는 이 필드가 아예 안 보입니다.
    @JsonIgnore
    private List<Long> insertedIds;
}