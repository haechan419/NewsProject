package com.fullStc.support.dto;

import com.fullStc.support.domain.InquiryStatus;
import lombok.*;

/**
 * 관리자 문의 답변/상태변경 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InquiryAdminRequest {

    private InquiryStatus status;  // 상태 변경
    private String adminResponse;  // 관리자 답변
}
