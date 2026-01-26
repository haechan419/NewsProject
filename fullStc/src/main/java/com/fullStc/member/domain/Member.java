package com.fullStc.member.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fullStc.member.domain.enums.MemberRole;

// 회원 정보를 저장하는 도메인
@Entity
@Table(name = "members")
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@ToString(exclude = "memberRoleList")
@EntityListeners(AuditingEntityListener.class) // JPA Auditing을 위한 리스너 (생성일, 수정일 자동 관리)
public class Member {
    // 회원 고유 ID (PK)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 이메일 (유니크, 소셜 로그인 포함 모든 로그인에서 사용)
    @Column(unique = true, nullable = false, columnDefinition = "VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci")
    private String email;

    // 비밀번호 (일반 로그인 시 사용, 소셜 로그인은 null 가능)
    private String password;

    // 닉네임(중복 불가, null 불가)
    @Column(unique = true, nullable = false, columnDefinition = "VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci")
    private String nickname;

    // 로그인 제공자 (local: 일반 로그인, kakao: 카카오, naver: 네이버, google: 구글)
    @Column(nullable = false)
    @Builder.Default
    private String provider = "local";

    // 소셜 로그인 제공자의 사용자 고유 ID (일반 로그인은 null)
    private String providerId;

    // 계정 활성화 여부 (true: 활성, false: 비활성)
    @Builder.Default
    private boolean enabled = true;

    // 회원 권한 목록 (USER, ADMIN)
    @ElementCollection(fetch = FetchType.LAZY)
    @Builder.Default
    private List<MemberRole> memberRoleList = new ArrayList<>();
    
    // 계정 생성일시 (자동 생성)
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // 계정 수정일시 (자동 업데이트)
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // 권한 추가
    public void addRole(MemberRole memberRole){
        memberRoleList.add(memberRole);
    }

    // 모든 권한 제거
    public void clearRole(){
        memberRoleList.clear();
    }

    // 닉네임 변경
    public void changeNickname(String nickname){
        this.nickname = nickname;
    }

    // 비밀번호 변경
    public void changePassword(String password){
        this.password = password;
    }

    // 소셜 로그인 제공자 정보 변경
    public void changeProvider(String provider, String providerId){
        this.provider = provider;
        this.providerId = providerId;
    }

    // 계정 활성화/비활성화 상태 변경
    public void changeEnabled(boolean enabled){
        this.enabled = enabled;
    }
}