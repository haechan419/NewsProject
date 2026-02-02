package com.fullStc.support.dto;

import com.fullStc.support.domain.FaqCategory;
import com.fullStc.support.domain.InquiryStatus;
import com.fullStc.support.domain.InquiryTicket;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 문의 티켓 응답 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InquiryResponse {

    private Long id;
    private Long userId;
    private String userNickname;
    private String userEmail;
    private String title;
    private String content;
    private FaqCategory category;
    private String categoryName;
    private InquiryStatus status;
    private String statusName;
    private String aiResponse;
    private String adminResponse;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Entity -> DTO 변환
     */
    public static InquiryResponse from(InquiryTicket ticket) {
        return InquiryResponse.builder()
                .id(ticket.getId())
                .userId(ticket.getUser().getId())
                .userNickname(ticket.getUser().getNickname())
                .userEmail(ticket.getUser().getEmail())
                .title(ticket.getTitle())
                .content(ticket.getContent())
                .category(ticket.getCategory())
                .categoryName(ticket.getCategory() != null ? ticket.getCategory().getDisplayName() : null)
                .status(ticket.getStatus())
                .statusName(ticket.getStatus().getDisplayName())
                .aiResponse(ticket.getAiResponse())
                .adminResponse(ticket.getAdminResponse())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
