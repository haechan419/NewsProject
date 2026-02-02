package com.fullStc.ai.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tbl_scrap", indexes = @Index(name = "idx_scrap_member", columnList = "memberId"))
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class Scrap extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sno;

    @Column(nullable = false)
    private Long memberId; // members.id 참조

    @Column(length = 64, nullable = false)
    private String newsId; // news.id (해시값) 참조
}