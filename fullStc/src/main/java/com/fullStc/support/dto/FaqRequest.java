package com.fullStc.support.dto;

import com.fullStc.support.domain.FaqCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * FAQ 생성/수정 요청 DTO
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaqRequest {

    @NotNull(message = "카테고리는 필수입니다.")
    private FaqCategory category;

    @NotBlank(message = "질문은 필수입니다.")
    private String question;

    @NotBlank(message = "답변은 필수입니다.")
    private String answer;

    private String keywords;  // 선택
}
