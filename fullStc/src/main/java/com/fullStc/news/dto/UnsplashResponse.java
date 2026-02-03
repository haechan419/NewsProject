package com.fullStc.news.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true) // JSON에 모르는 필드가 있어도 에러 안 나게 설정
public class UnsplashResponse {
    private Urls urls;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Urls {
        private String regular; // 일반 화질 (웹용으로 적절)
        private String small;   // 썸네일용
        private String full;    // 초고화질
    }
}