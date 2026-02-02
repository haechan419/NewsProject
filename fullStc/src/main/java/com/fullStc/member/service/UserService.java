package com.fullStc.member.service;

import com.fullStc.member.dto.CategoryUpdateDTO;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.dto.ProfileUpdateDTO;
import org.springframework.web.multipart.MultipartFile;

// 사용자 관련 서비스 인터페이스
public interface UserService {

    // 사용자 정보 조회
    MemberDTO getUserInfo(Long userId);

    // 관심 카테고리 업데이트
    void updateUserCategories(Long userId, CategoryUpdateDTO categoryUpdateDTO);

    // 프로필(닉네임 등) 업데이트
    void updateProfile(Long userId, ProfileUpdateDTO profileUpdateDTO);

    // 계정 비활성(탈퇴)
    void deactivateUser(Long userId);

    // 프로필 이미지 업로드/변경
    void updateProfileImage(Long userId, MultipartFile file);

    // 프로필 이미지 삭제
    void deleteProfileImage(Long userId);
}
