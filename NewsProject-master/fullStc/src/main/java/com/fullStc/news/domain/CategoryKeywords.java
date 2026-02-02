package com.fullStc.news.domain;

import java.util.List;
import java.util.Map;

public class CategoryKeywords {
    // 내부 카테고리: top, politics, business, society, it, sports, world, culture
    public static final List<String> CATEGORIES =
            List.of("top","politics","business","society","it","sports","world","culture");

    public static final Map<String, String> KEYWORDS = Map.of(
            "top", "",
            "politics", "대통령 국회 외교 총선 정당",

            // ★ [여기] 이 줄이 없어서 지금 "한국"으로 검색되고 있습니다. 제발 넣어주세요.
            "economy", "증시 금리 환율 실적 물가 부동산 기업",
            "business", "증시 금리 환율 실적 물가 부동산 기업",

            "society", "사건 사고 교육 노동 복지",
            "it", "IT AI 인공지능 반도체 네이버 카카오",
            "sports", "야구 축구 농구 e스포츠 올림픽",
            "world", "국제 미국 중국 일본 러시아 유럽",
            "culture", "문화 연예 영화 드라마 K-POP"
    );

    public static String buildQuery(String category, String userQuery) {
        String base = KEYWORDS.getOrDefault(category, "");
        String uq = (userQuery == null) ? "" : userQuery.trim();

        String merged = (base + " " + uq).trim();
        return merged.isBlank() ? "한국" : merged;
    }

}