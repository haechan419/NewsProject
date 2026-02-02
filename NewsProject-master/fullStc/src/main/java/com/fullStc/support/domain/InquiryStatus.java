package com.fullStc.support.domain;

/**
 * 문의 티켓 상태 열거형
 */
public enum InquiryStatus {
    PENDING("대기중"),
    PROCESSING("처리중"),
    COMPLETED("완료");

    private final String displayName;

    InquiryStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
