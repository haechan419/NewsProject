package com.fullStc.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

/**
 * Python FastAPI로부터 받는 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PythonChatResponseDTO {
    
    /** AI 응답 메시지 */
    private String reply;
    
    /** 검색 수행 여부 */
    private Boolean searched;
    
    /** 검색 쿼리 */
    @JsonProperty("search_query")
    private String searchQuery;
    
    /** 검색 출처 목록 */
    private List<SearchSource> sources;
    
    /** 실시간 검색어 응답 여부 */
    @JsonProperty("is_trending")
    private Boolean isTrending;
    
    /** 실시간 검색어 데이터 */
    @JsonProperty("trending_data")
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
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendingData {
        private List<TrendingKeyword> keywords;
        
        @JsonProperty("updated_at")
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