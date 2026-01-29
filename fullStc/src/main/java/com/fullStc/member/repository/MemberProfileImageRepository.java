package com.fullStc.member.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberProfileImage;

// 회원 프로필 이미지 레포지토리
@Repository
public interface MemberProfileImageRepository extends JpaRepository<MemberProfileImage, Long> {

    // 회원으로 프로필 이미지 조회
    Optional<MemberProfileImage> findByMember(Member member);

    // 회원 ID로 프로필 이미지 조회
    Optional<MemberProfileImage> findByMemberId(Long memberId);

    // 회원 기준 삭제
    void deleteByMember(Member member);

    // 회원 ID 기준 삭제
    void deleteByMemberId(Long memberId);
}
