package com.fullStc.member.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 회원의 관심 카테고리를 저장하는 도메인
@Entity
@Table(name = "member_categories")
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
public class MemberCategory {
    // 카테고리 고유 ID (PK)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 카테고리를 선택한 회원 (다대일 관계)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // 관심 카테고리명 (엔터테이먼트, 경제, 스포츠, IT/기술, 사회/이슈)
    @Column(nullable = false)
    private String category;
}