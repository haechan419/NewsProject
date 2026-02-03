package com.fullStc.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AI 채팅 응답 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponseDTO {
    
    /** AI 응답 메시지 */
    private String reply;
    
    /** 응답 시각 */
    private LocalDateTime timestamp;

    /** 검색 수행 여부 */
    private Boolean searched;

    /** 검색 쿼리 */
    private String searchQuery;

    /** 검색 출처 목록 */
    private List<SearchSource> sources;

    /** 실시간 검색어 응답 여부 */
    private Boolean isTrending;

    /** 실시간 검색어 데이터 */
    private TrendingData trendingData;

    /**
     * 검색 출처 내부 클래스
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchSource {
        private String title;
        private String url;
        private String snippet;
    }

    /**
     * 실시간 검색어 데이터 내부 클래스
     */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendingData {
        private List<TrendingKeyword> keywords;
        private String updatedAt;
        private String source;
    }

    /**
     * 실시간 검색어 키워드 내부 클래스
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendingKeyword {
        private Integer rank;
        private String keyword;
        private String state;
    }
}