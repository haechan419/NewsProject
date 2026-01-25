package com.fullStc.util;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import com.fullStc.member.domain.enums.MemberRole;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

// JWT 토큰 생성, 검증, 파싱을 담당하는 유틸리티 클래스
@Component
public class JwtUtil {

    // JWT 서명에 사용할 시크릿 키
    private final SecretKey secretKey;

    // Access Token 만료 시간 (밀리초) - 기본 2시간
    private final long accessTokenExpiration;

    // Refresh Token 만료 시간 (밀리초) - 7일
    private final long refreshTokenExpiration;

    // 생성자: application.properties에서 설정값 주입
    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        // 시크릿 문자열을 SecretKey로 변환 (HS256 알고리즘 사용)
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    // Access Token 생성 (기본 2시간 유효)
    // userId, email, role을 포함하여 토큰 생성
    public String generateAccessToken(Long userId, String email, List<MemberRole> roles) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

        // 권한을 문자열 리스트로 변환
        List<String> roleNames = roles.stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        return Jwts.builder()
                .setSubject(String.valueOf(userId)) // 사용자 ID를 subject로 설정
                .claim("email", email) // 이메일을 클레임에 추가
                .claim("roles", roleNames) // 권한 목록을 클레임에 추가
                .setIssuedAt(now) // 발행 시간
                .setExpiration(expiryDate) // 만료 시간
                .signWith(secretKey) // 서명
                .compact();
    }

    // Refresh Token 생성 (7일 유효)
    // userId만 포함하여 토큰 생성 (보안상 최소한의 정보만 포함)
    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpiration);

        return Jwts.builder()
                .setSubject(String.valueOf(userId)) // 사용자 ID를 subject로 설정
                .setIssuedAt(now) // 발행 시간
                .setExpiration(expiryDate) // 만료 시간
                .signWith(secretKey) // 서명
                .compact();
    }

    // 토큰에서 사용자 ID 추출
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return Long.parseLong(claims.getSubject());
    }

    // 토큰에서 이메일 추출
    public String extractEmail(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("email", String.class);
    }

    // 토큰에서 권한 목록 추출
    @SuppressWarnings("unchecked")
    public List<GrantedAuthority> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        List<String> roles = claims.get("roles", List.class);
        
        if (roles == null) {
            return List.of();
        }
        
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    // 토큰에서 만료일 추출
    public Date getExpirationDate(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getExpiration();
    }

    // 토큰 유효성 검증 (boolean 반환)
    public boolean validateToken(String token) {
        try {
            // 토큰 파싱 및 서명 검증
            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            // 토큰이 유효하지 않거나 만료된 경우
            return false;
        }
    }

    // 토큰 유효성 검증 및 클레임 반환 (Map 반환 - 참고 코드용)
    public Map<String, Object> validateTokenAndGetClaims(String token) {
        Claims claims = extractAllClaims(token);
        Map<String, Object> claimsMap = new HashMap<>();
        claimsMap.put("sub", claims.getSubject());
        claimsMap.put("email", claims.get("email"));
        // 보안: password는 JWT 클레임에 포함하지 않음
        claimsMap.put("roles", claims.get("roles"));
        claimsMap.put("roleNames", claims.get("roleNames"));
        claimsMap.put("nickname", claims.get("nickname"));
        claimsMap.put("provider", claims.get("provider"));
        claimsMap.put("social", claims.get("social"));
        claimsMap.put("enabled", claims.get("enabled"));
        if (claims.get("id") != null) {
            claimsMap.put("id", claims.get("id"));
        }
        return claimsMap;
    }

    // 토큰 생성 (분 단위 만료 시간 설정 - 참고 코드용)
    public String generateToken(Map<String, Object> claims, long expirationMinutes) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + (expirationMinutes * 60 * 1000));

        var builder = Jwts.builder()
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey);

        // 클레임 추가
        if (claims.get("sub") != null) {
            builder.setSubject(claims.get("sub").toString());
        } else if (claims.get("id") != null) {
            builder.setSubject(claims.get("id").toString());
        }

        if (claims.get("email") != null) {
            builder.claim("email", claims.get("email"));
        }
        if (claims.get("roles") != null) {
            builder.claim("roles", claims.get("roles"));
        }
        if (claims.get("roleNames") != null) {
            builder.claim("roleNames", claims.get("roleNames"));
        }
        if (claims.get("nickname") != null) {
            builder.claim("nickname", claims.get("nickname"));
        }
        if (claims.get("provider") != null) {
            builder.claim("provider", claims.get("provider"));
        }
        if (claims.get("social") != null) {
            builder.claim("social", claims.get("social"));
        }
        if (claims.get("enabled") != null) {
            builder.claim("enabled", claims.get("enabled"));
        }
        // 보안: password는 JWT 클레임에 포함하지 않음

        return builder.compact();
    }

    // 토큰이 만료되었는지 확인
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = getExpirationDate(token);
            return expiration.before(new Date());
        } catch (Exception e) {
            return true; // 예외 발생 시 만료된 것으로 간주
        }
    }

    // 토큰에서 모든 클레임 추출
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
