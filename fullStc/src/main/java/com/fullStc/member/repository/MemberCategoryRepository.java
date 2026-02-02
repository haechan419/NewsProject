package com.fullStc.member.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;

// MemberCategory 엔티티를 위한 JPA Repository
@Repository
public interface MemberCategoryRepository extends JpaRepository<MemberCategory, Long> {
    
    // 회원 ID로 관심 카테고리 목록 조회 (member.id를 통해 조회)
    @Query("SELECT mc FROM MemberCategory mc WHERE mc.member.id = :memberId")
    List<MemberCategory> findByMemberId(@Param("memberId") Long memberId);
    
    // 회원으로 관심 카테고리 목록 조회
    List<MemberCategory> findByMember(Member member);
    
    // 회원 ID로 모든 관심 카테고리 삭제
    @Modifying
    @Transactional
    @Query("DELETE FROM MemberCategory mc WHERE mc.member.id = :memberId")
    void deleteByMemberId(@Param("memberId") Long memberId);
    
    // 회원으로 모든 관심 카테고리 삭제
    void deleteByMember(Member member);
    
    // 회원 ID와 카테고리명으로 조회
    @Query("SELECT mc FROM MemberCategory mc WHERE mc.member.id = :memberId AND mc.category = :category")
    List<MemberCategory> findByMemberIdAndCategory(@Param("memberId") Long memberId, @Param("category") String category);
}
