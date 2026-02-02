package com.fullStc.support.dto;

import com.fullStc.support.domain.FaqCategory;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * 문의 티켓 생성 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InquiryCreateRequest {

    @NotBlank(message = "제목은 필수입니다.")
    private String title;

    @NotBlank(message = "내용은 필수입니다.")
    private String content;

    private FaqCategory category;  // 선택
}
