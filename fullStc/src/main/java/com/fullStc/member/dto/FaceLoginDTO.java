package com.fullStc.member.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 얼굴 로그인 요청을 위한 DTO
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FaceLoginDTO {
    // 매칭된 사용자 ID (이메일)
    // 프론트엔드에서 email 필드로 보내므로 email도 지원
    @NotBlank(message = "사용자 ID는 필수입니다")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String email;
    
    // matchedUserId도 지원 (email이 없을 경우 사용)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String matchedUserId;
    
    // 실제 사용할 사용자 ID를 반환하는 메서드
    public String getUserId() {
        return email != null && !email.isEmpty() ? email : matchedUserId;
    }
}
