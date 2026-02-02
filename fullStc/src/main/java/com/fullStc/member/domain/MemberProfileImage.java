package com.fullStc.member.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

// 회원 프로필 사진 정보를 저장하는 도메인
// 실제 파일은 로컬/클라우드 스토리지에 저장하고
// DB에는 저장된 파일명만 보관 (예: UUID.png)
@Entity
@Table(name = "member_profile_images")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "member")
@EntityListeners(AuditingEntityListener.class)
public class MemberProfileImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 프로필을 소유한 회원 (1:1)
    @OneToOne
    @JoinColumn(name = "member_id", nullable = false, unique = true)
    private Member member;

    // 저장된 파일명 (FileStorageService의 storedFileName, 예: 123e4567-....png)
    @Column(name = "image_url", nullable = false, length = 1024)
    private String imageUrl;

    // 원본 파일명
    @Column(name = "original_filename", length = 255)
    private String originalFilename;

    // MIME 타입
    @Column(name = "content_type", length = 100)
    private String contentType;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public void changeImage(String imageUrl, String originalFilename, String contentType) {
        this.imageUrl = imageUrl;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
    }

    // 썸네일 파일명 (항상 s_ 로 시작)
    public String getThumbnailFileName() {
        if (imageUrl == null) {
            return null;
        }
        return "s_" + imageUrl;
    }
}
