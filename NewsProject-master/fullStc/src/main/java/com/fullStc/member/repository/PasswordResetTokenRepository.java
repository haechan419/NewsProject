package com.fullStc.member.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.member.domain.PasswordResetToken;

// PasswordResetToken 엔티티를 위한 JPA Repository
@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    // 토큰 값으로 PasswordResetToken 조회
    Optional<PasswordResetToken> findByToken(String token);
    
    // 회원 ID로 PasswordResetToken 조회
    @Query("SELECT prt FROM PasswordResetToken prt WHERE prt.member.id = :memberId")
    List<PasswordResetToken> findByMemberId(@Param("memberId") Long memberId);
    
    // 회원 ID로 모든 PasswordResetToken 삭제
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken prt WHERE prt.member.id = :memberId")
    void deleteByMemberId(@Param("memberId") Long memberId);
}
