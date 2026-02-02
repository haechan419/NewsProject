package com.fullStc.ai.repository;

import com.fullStc.ai.domain.Face;
import com.fullStc.member.domain.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 얼굴 인식 데이터 레포지토리
 */
@Repository
public interface FaceRepository extends JpaRepository<Face, Long> {
    
    /**
     * 회원으로 얼굴 데이터 조회 (최신순)
     * @param member 회원
     * @return 얼굴 데이터 목록
     */
    List<Face> findByMemberOrderByCreatedAtDesc(Member member);
    
    /**
     * 회원 ID로 얼굴 데이터 조회 (최신순)
     * @param memberId 회원 ID
     * @return 얼굴 데이터 목록
     */
    @Query("SELECT f FROM Face f WHERE f.member.id = :memberId ORDER BY f.createdAt DESC")
    List<Face> findByMemberIdOrderByCreatedAtDesc(@Param("memberId") Long memberId);
    
    /**
     * 회원 이메일로 얼굴 데이터 조회 (최신순)
     * @param email 회원 이메일
     * @return 얼굴 데이터 목록
     */
    @Query("SELECT f FROM Face f WHERE f.member.email = :email ORDER BY f.createdAt DESC")
    List<Face> findByMemberEmailOrderByCreatedAtDesc(@Param("email") String email);
    
    /**
     * 회원의 가장 최근 얼굴 데이터 조회
     * @param member 회원
     * @return 가장 최근 얼굴 데이터
     */
    Optional<Face> findFirstByMemberOrderByCreatedAtDesc(Member member);
    
    /**
     * 회원 이메일로 가장 최근 얼굴 데이터 조회
     * @param email 회원 이메일
     * @return 가장 최근 얼굴 데이터
     */
    @Query("SELECT f FROM Face f WHERE f.member.email = :email ORDER BY f.createdAt DESC")
    Optional<Face> findFirstByMemberEmailOrderByCreatedAtDesc(@Param("email") String email);
    
    /**
     * 회원으로 얼굴 데이터 존재 여부 확인
     * @param member 회원
     * @return 존재 여부
     */
    boolean existsByMember(Member member);
    
    /**
     * 회원 ID로 얼굴 데이터 삭제
     * @param memberId 회원 ID
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM Face f WHERE f.member.id = :memberId")
    void deleteByMemberId(@Param("memberId") Long memberId);
}
