package com.fullStc.member.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fullStc.member.domain.Member;

// Member 엔티티를 위한 JPA Repository
@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    
    // 이메일로 회원 조회 (권한 포함)
    @EntityGraph(attributePaths = {"memberRoleList"})
    Optional<Member> findByEmail(String email);
    
    // 이메일로 회원 조회 (권한 포함) - 참고 코드 스타일
    @EntityGraph(attributePaths = {"memberRoleList"})
    @Query("SELECT m FROM Member m WHERE m.email = :email")
    Member getWithRoles(@Param("email") String email);
    
    // 이메일 존재 여부 확인
    boolean existsByEmail(String email);
    
    // 닉네임 존재 여부 확인
    boolean existsByNickname(String nickname);
    
    // 닉네임으로 회원 조회
    @EntityGraph(attributePaths = {"memberRoleList"})
    Optional<Member> findByNickname(String nickname);
    
    // 제공자와 제공자 ID로 회원 조회 (소셜 로그인용)
    Optional<Member> findByProviderAndProviderId(String provider, String providerId);
}
