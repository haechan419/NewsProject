package com.fullStc.board.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 댓글 첨부 파일 엔티티
 * 댓글에 첨부된 파일 정보를 담는 엔티티
 */
@Entity
@Table(name = "comment_file")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 파일 ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private BoardComment comment; // 댓글

    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName; // 원본 파일명

    @Column(name = "stored_file_name", nullable = false, length = 255)
    private String storedFileName; // 저장된 파일명

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath; // 파일 경로

    @Column(name = "file_size")
    private Long fileSize; // 파일 크기

    @Column(name = "file_type", length = 100)
    private String fileType; // 파일 타입 (MIME type)

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

