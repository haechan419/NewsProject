package com.fullStc.member.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.RefreshToken;

// RefreshToken 엔티티를 위한 JPA Repository
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    // 토큰 값으로 RefreshToken 조회
    Optional<RefreshToken> findByToken(String token);
    
    // 회원 ID로 RefreshToken 조회 (member.id를 통해 조회)
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.member.id = :memberId")
    List<RefreshToken> findByMemberId(@Param("memberId") Long memberId);
    
    // 회원 ID로 모든 RefreshToken 삭제
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.member.id = :memberId")
    void deleteByMemberId(@Param("memberId") Long memberId);
    
    // 회원으로 RefreshToken 조회
    List<RefreshToken> findByMember(Member member);
    
    // 회원으로 모든 RefreshToken 삭제
    void deleteByMember(Member member);
}
