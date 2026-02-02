package com.fullStc.ai.domain;

import com.fullStc.member.domain.Member;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 얼굴 인식 데이터 엔티티
 * 사용자의 얼굴 이미지와 분석 결과를 저장
 */
@Entity
@Table(name = "faces")
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@EntityListeners(AuditingEntityListener.class)
public class Face {
    
    /** 얼굴 데이터 고유 ID (PK) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /** 회원 정보 (Many-to-One 관계) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;
    
    /** Base64 인코딩된 얼굴 이미지 */
    @Column(name = "image_base64", columnDefinition = "LONGTEXT", nullable = false)
    private String imageBase64;
    
    /** 얼굴 특징 설명 (OpenAI 분석 결과) */
    @Column(name = "face_description", columnDefinition = "TEXT")
    private String faceDescription;
    
    /** 얼굴 감지 여부 */
    @Column(name = "face_detected", nullable = false)
    @Builder.Default
    private Boolean faceDetected = true;
    
    /** 얼굴 개수 */
    @Column(name = "face_count")
    @Builder.Default
    private Integer faceCount = 1;
    
    /** 이미지 품질 (good/fair/poor) */
    @Column(name = "quality", length = 10)
    private String quality;
    
    /** 등록일시 (자동 생성) */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /** 수정일시 (자동 업데이트) */
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /** 얼굴 설명 업데이트 */
    public void updateFaceDescription(String faceDescription) {
        this.faceDescription = faceDescription;
    }
    
    /** 이미지 업데이트 */
    public void updateImage(String imageBase64) {
        this.imageBase64 = imageBase64;
    }
}
