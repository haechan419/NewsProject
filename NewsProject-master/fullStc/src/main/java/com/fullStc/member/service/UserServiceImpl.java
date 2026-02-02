package com.fullStc.member.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fullStc.board.service.FileStorageService;
import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.domain.MemberProfileImage;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.dto.CategoryUpdateDTO;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.dto.ProfileUpdateDTO;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.MemberProfileImageRepository;
import com.fullStc.member.repository.MemberRepository;
import com.fullStc.member.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 사용자 관련 서비스 구현
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final MemberRepository memberRepository;
    private final MemberCategoryRepository memberCategoryRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MemberProfileImageRepository memberProfileImageRepository;
    private final FileStorageService fileStorageService;

    // 사용자 정보 조회
    @Override
    @Transactional(readOnly = true)
    public MemberDTO getUserInfo(Long userId) {
        log.info("사용자 정보 조회: userId={}", userId);

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        // 권한을 문자열 리스트로 변환
        List<String> roleNames = member.getMemberRoleList().stream()
                .map(MemberRole::name)
                .collect(Collectors.toList());

        // 관심 카테고리 조회
        List<String> categories = memberCategoryRepository.findByMemberId(userId).stream()
                .map(MemberCategory::getCategory)
                .collect(Collectors.toList());

        // 프로필 이미지 조회
        String profileImageUrl = memberProfileImageRepository.findByMemberId(userId)
                .map(profileImage -> "/api/files/" + profileImage.getImageUrl())
                .orElse(null);

        MemberDTO memberDTO = MemberDTO.builder()
                .id(member.getId())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .provider(member.getProvider())
                .enabled(member.isEnabled())
                .roleNames(roleNames)
                .categories(categories)
                .profileImageUrl(profileImageUrl)
                .createdAt(member.getCreatedAt())
                .updatedAt(member.getUpdatedAt())
                .build();

        log.info("사용자 정보 조회 완료: userId={}, profileImageUrl={}", userId, profileImageUrl);
        return memberDTO;
    }

    // 관심 카테고리 업데이트
    @Override
    public void updateUserCategories(Long userId, CategoryUpdateDTO categoryUpdateDTO) {
        log.info("관심 카테고리 업데이트: userId={}, categories={}", userId, categoryUpdateDTO.getCategories());

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        // 기존 카테고리 삭제
        memberCategoryRepository.deleteByMemberId(userId);

        // 새로운 카테고리 추가 (비어있지 않은 경우에만)
        if (categoryUpdateDTO.getCategories() != null) {
            for (String category : categoryUpdateDTO.getCategories()) {
                if (category != null && !category.trim().isEmpty()) {
                    MemberCategory memberCategory = MemberCategory.builder()
                            .member(member)
                            .category(category.trim())
                            .build();
                    memberCategoryRepository.save(memberCategory);
                }
            }
        }

        log.info("관심 카테고리 업데이트 완료: userId={}, categories={}", userId, categoryUpdateDTO.getCategories());
    }

    // 프로필(닉네임 등) 업데이트
    @Override
    public void updateProfile(Long userId, ProfileUpdateDTO profileUpdateDTO) {
        log.info("프로필 업데이트 요청: userId={}, nickname={}", userId, profileUpdateDTO.getNickname());

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        String newNickname = profileUpdateDTO.getNickname();

        // 닉네임이 실제로 변경되는 경우에만 중복 체크
        if (!member.getNickname().equals(newNickname)
                && memberRepository.existsByNickname(newNickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다");
        }

        member.changeNickname(newNickname);

        log.info("프로필 업데이트 완료: userId={}, nickname={}", userId, newNickname);
    }

    // 계정 비활성(탈퇴)
    @Override
    public void deactivateUser(Long userId) {
        log.info("계정 비활성 요청: userId={}", userId);

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        // 계정 비활성 처리 (소프트 삭제)
        member.changeEnabled(false);

        // 로그인 유지용 토큰 제거
        refreshTokenRepository.deleteByMemberId(userId);

        log.info("계정 비활성 처리 완료: userId={}", userId);
    }

    // 프로필 이미지 업로드/변경
    @Override
    public void updateProfileImage(Long userId, MultipartFile file) {
        log.info("프로필 이미지 업로드 요청: userId={}", userId);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다");
        }

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        // 새 파일을 먼저 스토리지에 저장
        FileStorageService.FileInfo info = fileStorageService.storeFile(file);
        if (info == null) {
            throw new RuntimeException("프로필 이미지 저장에 실패했습니다");
        }

        // 기존 프로필 이미지 엔티티 조회
        MemberProfileImage profileImage = memberProfileImageRepository.findByMember(member)
                .orElse(null);

        if (profileImage != null) {
            // 기존 물리 파일 삭제
            String storedFileName = profileImage.getImageUrl();
            if (storedFileName != null) {
                fileStorageService.deleteFile(storedFileName);
            }
            // 동일 엔티티의 필드만 변경 (INSERT 대신 UPDATE)
            profileImage.changeImage(
                    info.getStoredFileName(),
                    info.getOriginalFileName(),
                    info.getFileType());
        } else {
            // 기존 레코드가 없으면 새로 생성
            profileImage = MemberProfileImage.builder()
                    .member(member)
                    .imageUrl(info.getStoredFileName())
                    .originalFilename(info.getOriginalFileName())
                    .contentType(info.getFileType())
                    .build();
        }

        memberProfileImageRepository.save(profileImage);

        log.info("프로필 이미지 업로드 완료: userId={}, storedFileName={}, thumbnailFileName={}",
                userId, profileImage.getImageUrl(), profileImage.getThumbnailFileName());
    }

    // 프로필 이미지 삭제
    @Override
    public void deleteProfileImage(Long userId) {
        log.info("프로필 이미지 삭제 요청: userId={}", userId);

        Member member = memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));

        memberProfileImageRepository.findByMember(member).ifPresent(existing -> {
            String storedFileName = existing.getImageUrl();
            if (storedFileName != null) {
                fileStorageService.deleteFile(storedFileName);
            }
            memberProfileImageRepository.delete(existing);
        });

        log.info("프로필 이미지 삭제 완료: userId={}", userId);
    }
}
