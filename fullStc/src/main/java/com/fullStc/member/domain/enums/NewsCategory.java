package com.fullStc.member.domain.enums;

import lombok.Getter;

// 뉴스 카테고리 Enum
@Getter
public enum NewsCategory {
    POLITICS("정치"),
    ECONOMY("경제"),
    ENTERTAINMENT("엔터"),
    IT_SCIENCE("IT/과학"),
    SPORTS("스포츠"),
    INTERNATIONAL("국제");

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

    // 표시 이름 목록 반환
    public static String[] getAllDisplayNames() {
        NewsCategory[] categories = values();
        String[] displayNames = new String[categories.length];
        for (int i = 0; i < categories.length; i++) {
            displayNames[i] = categories[i].displayName;
        }
        return displayNames;
    }

    // 크롤 카테고리 이름으로 Enum 찾기 (예: "politics", "economy" 등)
    public static NewsCategory fromCrawlCategory(String crawlCategory) {
        if (crawlCategory == null) {
            throw new IllegalArgumentException("카테고리가 null입니다");
        }
        String normalized = crawlCategory.toLowerCase().trim();
        switch (normalized) {
            case "politics": return POLITICS;
            case "economy": return ECONOMY;
            case "entertainment": return ENTERTAINMENT;
            case "it_science":
            case "it":
            case "science": return IT_SCIENCE;
            case "sports": return SPORTS;
            case "international": return INTERNATIONAL;
            default:
                throw new IllegalArgumentException("알 수 없는 크롤 카테고리: " + crawlCategory);
        }
    }

    // Enum을 크롤 카테고리 이름으로 변환
    public String toCrawlCategory() {
        switch (this) {
            case POLITICS: return "politics";
            case ECONOMY: return "economy";
            case ENTERTAINMENT: return "entertainment";
            case IT_SCIENCE: return "it_science";
            case SPORTS: return "sports";
            case INTERNATIONAL: return "international";
            default: return name().toLowerCase();
        }
    }
}
