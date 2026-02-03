package com.fullStc.news.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import com.fullStc.news.domain.NewsCluster;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Getter
@NoArgsConstructor
public class BriefingResponseDTO {
    private Long id;
    private String title;
    private String summary;
    private String originalUrl;
    private String date;
    private String category;
    private String image;

    // ✅ 백엔드 공개 주소(개발용)
    // 배포 시 application.yml 값으로 빼는 게 베스트지만, 일단 고치기만 하면 이걸로 충분함.
    private static final String BACKEND_BASE_URL = "http://localhost:8080";

    private static String toProxyImageUrl(String raw) {
        if (raw == null || raw.isBlank()) return null;

        // 이미 프록시면 그대로
        if (raw.startsWith(BACKEND_BASE_URL + "/api/images/pollinations")) return raw;

        String b64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(raw.getBytes(StandardCharsets.UTF_8));

        return BACKEND_BASE_URL + "/api/images/pollinations?b64=" + b64;
    }

    // 1) NewsCluster -> DTO
    public BriefingResponseDTO(NewsCluster cluster) {
        this.id = cluster.getId();
        this.title = cluster.getClusterTitle();
        this.summary = cluster.getClusterSummary();
        this.originalUrl = cluster.getRepresentativeUrl();
        this.date = (cluster.getCreatedAt() != null) ? cluster.getCreatedAt().toString() : "";
        this.category = cluster.getCategory();

        // ✅ 핵심: 원본 URL 대신 프록시 URL로 내려줌
        this.image = toProxyImageUrl(cluster.getImageUrl());
    }

    // 2) 낱개 데이터 -> DTO
    public BriefingResponseDTO(Long id, String title, String summary, String category, String originalUrl, String date, String image) {
        this.id = id;
        this.title = title;
        this.summary = summary;
        this.category = category;
        this.originalUrl = originalUrl;
        this.date = date;

        // ✅ 핵심: 원본 URL 대신 프록시 URL로 내려줌
        this.image = toProxyImageUrl(image);
    }
}
