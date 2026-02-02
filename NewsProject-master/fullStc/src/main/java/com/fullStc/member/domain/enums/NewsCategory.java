package com.fullStc.member.domain.enums;

import lombok.Getter;

// 뉴스 카테고리 Enum
// 크롤링 카테고리와 일치: culture, economy, IT, politics, society, world
@Getter
public enum NewsCategory {
    CULTURE("문화"), // culture
    ECONOMY("경제"), // economy
    IT("IT"), // IT
    POLITICS("정치"), // politics
    SOCIETY("사회"), // society
    WORLD("세계"); // world

    private final String displayName;

    NewsCategory(String displayName) {
        this.displayName = displayName;
    }

    // 표시 이름으로 Enum 찾기
    public static NewsCategory fromDisplayName(String displayName) {
        for (NewsCategory category : values()) {
            if (category.displayName.equals(displayName)) {
                return category;
            }
        }
        throw new IllegalArgumentException("알 수 없는 카테고리: " + displayName);
    }

    // 크롤링 카테고리 이름으로 Enum 찾기 (소문자)
    public static NewsCategory fromCrawlCategory(String crawlCategory) {
        if (crawlCategory == null) {
            throw new IllegalArgumentException("카테고리가 null입니다");
        }
        String lower = crawlCategory.toLowerCase();
        switch (lower) {
            case "culture":
                return CULTURE;
            case "economy":
                return ECONOMY;
            case "it":
            case "it/technology":
                return IT;
            case "politics":
                return POLITICS;
            case "society":
                return SOCIETY;
            case "world":
                return WORLD;
            default:
                throw new IllegalArgumentException("알 수 없는 크롤링 카테고리: " + crawlCategory);
        }
    }

    // Enum 이름을 크롤링 카테고리 이름으로 변환 (소문자)
    public String toCrawlCategory() {
        switch (this) {
            case CULTURE:
                return "culture";
            case ECONOMY:
                return "economy";
            case IT:
                return "it";
            case POLITICS:
                return "politics";
            case SOCIETY:
                return "society";
            case WORLD:
                return "world";
            default:
                return name().toLowerCase();
        }
    }

    // 표시 이름 목록 반환
    public static String[] getAllDisplayNames() {
        NewsCategory[] categories = values();
        String[] displayNames = new String[categories.length];
        for (int i = 0; i < categories.length; i++) {
            displayNames[i] = categories[i].displayName;
        }
        return displayNames;
    }
}
