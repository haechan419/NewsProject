package com.fullStc.member.service;

import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.dto.ProfileUpdateDTO;

// 사용자 관련 서비스 인터페이스
public interface UserService {
    
    // 사용자 정보 조회
    MemberDTO getUserInfo(Long userId);
    
    // 프로필 업데이트 (닉네임 수정)
    void updateUserProfile(Long userId, ProfileUpdateDTO profileUpdateDTO);
}
