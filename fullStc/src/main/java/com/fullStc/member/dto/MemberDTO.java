package com.fullStc.member.dto;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 회원 정보를 위한 DTO (UserDetails, OAuth2User 구현)
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MemberDTO implements UserDetails, OAuth2User {
    // 회원 고유 ID
    private Long id;

    // 이메일
    private String email;

    // 비밀번호 (인증용)
    private String password;

    // 닉네임
    private String nickname;

    // 로그인 제공자 (local, kakao, naver, google)
    private String provider;

    // 계정 활성화 여부
    private boolean enabled;

    // 회원 권한 목록 (문자열 리스트)
    private List<String> roleNames;

    // 관심 카테고리 목록
    private List<String> categories;

    // 계정 생성일시
    private LocalDateTime createdAt;

    // 계정 수정일시
    private LocalDateTime updatedAt;

    // UserDetails 구현 메서드들
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (roleNames == null) {
            return List.of();
        }
        return roleNames.stream()
                .map(role -> "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // OAuth2User 구현 메서드들
    @Override
    public Map<String, Object> getAttributes() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("id", id);
        attributes.put("email", email);
        attributes.put("nickname", nickname);
        attributes.put("provider", provider);
        attributes.put("enabled", enabled);
        attributes.put("roleNames", roleNames);
        return attributes;
    }

    @Override
    public String getName() {
        return email != null ? email : "";
    }

    // JWT 클레임 생성을 위한 메서드
    public Map<String, Object> getClaims() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("password", password);
        claims.put("nickname", nickname);
        claims.put("provider", provider);
        claims.put("social", !"local".equals(provider));
        claims.put("enabled", enabled);
        claims.put("roleNames", roleNames);
        if (id != null) {
            claims.put("id", id);
        }
        return claims;
    }
}
