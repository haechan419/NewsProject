package com.fullStc.support.domain;

/**
 * FAQ 카테고리 열거형
 */
public enum FaqCategory {
    DRIVE("드라이브모드"),
    VIDEO("영상제작"),
    POST("게시물작성"),
    ACCOUNT("프로필/계정"),
    ETC("기타");

    private final String displayName;

    FaqCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
