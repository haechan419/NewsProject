package com.fullStc.member.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.MemberCategory;
import com.fullStc.member.domain.RefreshToken;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.domain.enums.NewsCategory;
import com.fullStc.member.dto.FaceLoginDTO;
import com.fullStc.member.dto.LoginDTO;
import com.fullStc.member.dto.LoginResponseDTO;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.dto.RefreshTokenRequestDTO;
import com.fullStc.member.dto.SignUpDTO;
import com.fullStc.member.dto.TokenDTO;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.MemberRepository;
import com.fullStc.member.repository.RefreshTokenRepository;
import com.fullStc.util.JwtUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

// 인증 관련 서비스 구현
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final MemberRepository memberRepository;
    private final MemberCategoryRepository memberCategoryRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // 회원가입
    @Override
    public Long signUp(SignUpDTO signUpDTO) {
        log.info("회원가입 요청: email={}", signUpDTO.getEmail());

        // 이메일 중복 확인
        if (memberRepository.existsByEmail(signUpDTO.getEmail())) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다");
        }

        // 닉네임 중복 확인
        if (memberRepository.existsByNickname(signUpDTO.getNickname())) {
            throw new IllegalArgumentException("이미 존재하는 닉네임입니다");
        }

        // 카테고리 유효성 검증 및 개수 검증
        if (signUpDTO.getCategories() != null) {
            if (signUpDTO.getCategories().size() > 3) {
                throw new IllegalArgumentException("관심 카테고리는 최대 3개까지 선택할 수 있습니다");
            }

            // 카테고리 유효성 검증 (크롤링 카테고리 형식으로 변환하여 검증)
            for (String category : signUpDTO.getCategories()) {
                try {
                    // 크롤링 카테고리 형식으로 변환 시도
                    NewsCategory.fromCrawlCategory(category);
                } catch (IllegalArgumentException e1) {
                    try {
                        // displayName 형식이면 크롤링 형식으로 변환
                        NewsCategory.fromDisplayName(category);
                    } catch (IllegalArgumentException e2) {
                        throw new IllegalArgumentException("유효하지 않은 카테고리입니다: " + category);
                    }
                }
            }
        }

        // 회원 생성
        Member member = Member.builder()
                .email(signUpDTO.getEmail())
                .password(passwordEncoder.encode(signUpDTO.getPassword()))
                .nickname(signUpDTO.getNickname())
                .provider("local")
                .enabled(true)
                .build();

        // 기본 권한 추가 (USER)
        member.addRole(MemberRole.USER);

        Member savedMember = memberRepository.save(member);
        log.info("회원가입 완료: id={}, email={}", savedMember.getId(), savedMember.getEmail());

        // 관심 카테고리 저장 (최대 3개까지만 저장, 크롤링 카테고리 형식으로 변환)
        if (signUpDTO.getCategories() != null && !signUpDTO.getCategories().isEmpty()) {
            List<String> categoriesToSave = signUpDTO.getCategories().stream()
                    .limit(3)
                    .filter(category -> category != null && !category.trim().isEmpty())
                    .map(String::trim)
                    .map(category -> {
                        // 크롤링 카테고리 형식으로 변환
                        try {
                            // 먼저 크롤링 형식인지 확인 (소문자 변환 포함)
                            String lower = category.toLowerCase();
                            NewsCategory.fromCrawlCategory(lower);
                            return lower; // 소문자로 반환
                        } catch (IllegalArgumentException e1) {
                            try {
                                // displayName 형식이면 크롤링 형식으로 변환
                                NewsCategory newsCategory = NewsCategory.fromDisplayName(category);
                                return newsCategory.toCrawlCategory();
                            } catch (IllegalArgumentException e2) {
                                // 유효성 검증에서 이미 체크했으므로 여기서는 발생하지 않아야 함
                                throw new IllegalArgumentException("유효하지 않은 카테고리입니다: " + category);
                            }
                        }
                    })
                    .collect(Collectors.toList());

            for (String category : categoriesToSave) {
                MemberCategory memberCategory = MemberCategory.builder()
                        .member(savedMember)
                        .category(category)
                        .build();
                memberCategoryRepository.save(memberCategory);
            }
            log.info("관심 카테고리 저장 완료: userId={}, categories={}", savedMember.getId(), categoriesToSave);
        }

        return savedMember.getId();
    }

    // 로그인
    @Override
    public LoginResponseDTO login(LoginDTO loginDTO) {
        log.info("로그인 요청: email={}", loginDTO.getEmail());

        // 사용자 조회 및 검증
        Member member = validateLogin(loginDTO);

        // MemberDTO 생성
        MemberDTO memberDTO = createMemberDTO(member);

        // 토큰 생성 및 저장
        TokenDTO tokenDTO = generateAndSaveTokens(member, memberDTO);

        // 로그인 응답 생성
        LoginResponseDTO loginResponse = buildLoginResponse(memberDTO, tokenDTO);

        log.info("로그인 성공: userId={}, email={}", member.getId(), member.getEmail());

        return loginResponse;
    }

    // 얼굴 로그인
    @Override
    public LoginResponseDTO faceLogin(FaceLoginDTO faceLoginDTO) {
        String userId = faceLoginDTO.getUserId();
        log.info("얼굴 로그인 요청: userId={}", userId);

        if (userId == null || userId.isEmpty()) {
            throw new RuntimeException("사용자 ID가 필요합니다");
        }

        // 매칭된 사용자 ID로 회원 조회
        Member member = memberRepository.findByEmail(userId)
                .orElseThrow(() -> new RuntimeException("등록된 사용자를 찾을 수 없습니다"));

        // 계정 활성화 확인
        if (!member.isEnabled()) {
            log.warn("얼굴 로그인 실패: 비활성화된 계정 - email={}", faceLoginDTO.getMatchedUserId());
            throw new RuntimeException("비활성화된 계정입니다");
        }

        // MemberDTO 생성
        MemberDTO memberDTO = createMemberDTO(member);

        // 토큰 생성 및 저장
        TokenDTO tokenDTO = generateAndSaveTokens(member, memberDTO);

        // 로그인 응답 생성
        LoginResponseDTO loginResponse = buildLoginResponse(memberDTO, tokenDTO);

        log.info("얼굴 로그인 성공: userId={}, email={}", member.getId(), member.getEmail());

        return loginResponse;
    }

    // 로그인 검증 (사용자 조회, 비밀번호 확인, 계정 활성화 확인)
    private Member validateLogin(LoginDTO loginDTO) {
        Member member = memberRepository.findByEmail(loginDTO.getEmail())
                .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다"));

        if (!passwordEncoder.matches(loginDTO.getPassword(), member.getPassword())) {
            log.warn("로그인 실패: 비밀번호 불일치 - email={}", loginDTO.getEmail());
            throw new RuntimeException("비밀번호가 일치하지 않습니다");
        }

        if (!member.isEnabled()) {
            log.warn("로그인 실패: 비활성화된 계정 - email={}", loginDTO.getEmail());
            throw new RuntimeException("비활성화된 계정입니다");
        }

        return member;
    }

    // MemberDTO 생성 (회원 정보와 카테고리 포함)
    private MemberDTO createMemberDTO(Member member) {
        return MemberDTO.builder()
                .id(member.getId())
                .email(member.getEmail())
                .password(member.getPassword())
                .nickname(member.getNickname())
                .provider(member.getProvider())
                .enabled(member.isEnabled())
                .roleNames(member.getMemberRoleList().stream()
                        .map(role -> role.name())
                        .collect(Collectors.toList()))
                .categories(memberCategoryRepository.findByMemberId(member.getId()).stream()
                        .map(category -> category.getCategory())
                        .collect(Collectors.toList()))
                .build();
    }

    // 토큰 생성 및 RefreshToken 저장
    private TokenDTO generateAndSaveTokens(Member member, MemberDTO memberDTO) {
        Map<String, Object> claims = memberDTO.getClaims();
        String accessToken = jwtUtil.generateToken(claims, 60); // 60분
        String refreshToken = jwtUtil.generateToken(claims, 60 * 24); // 1일

        // Refresh Token 저장
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .member(member)
                .token(refreshToken)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        return TokenDTO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .build();
    }

    // 로그인 응답 생성
    private LoginResponseDTO buildLoginResponse(MemberDTO memberDTO, TokenDTO tokenDTO) {
        LoginResponseDTO.UserInfoDTO userInfo = LoginResponseDTO.UserInfoDTO.builder()
                .id(memberDTO.getId())
                .email(memberDTO.getEmail())
                .nickname(memberDTO.getNickname())
                .provider(memberDTO.getProvider())
                .enabled(memberDTO.isEnabled())
                .roleNames(memberDTO.getRoleNames())
                .categories(memberDTO.getCategories())
                .build();

        return LoginResponseDTO.builder()
                .token(tokenDTO)
                .user(userInfo)
                .build();
    }

    // Refresh Token으로 Access Token 갱신
    @Override
    public TokenDTO refreshToken(RefreshTokenRequestDTO refreshTokenRequestDTO) {
        log.info("토큰 갱신 요청");

        // Refresh Token 검증 및 회원 조회
        Member member = validateAndGetMemberFromRefreshToken(refreshTokenRequestDTO.getRefreshToken());

        // MemberDTO 생성
        MemberDTO memberDTO = createMemberDTO(member);

        // 새로운 Access Token 생성
        Map<String, Object> claims = memberDTO.getClaims();
        String newAccessToken = jwtUtil.generateToken(claims, 60); // 60분

        log.info("토큰 갱신 완료: userId={}", member.getId());

        return TokenDTO.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshTokenRequestDTO.getRefreshToken()) // 기존 Refresh Token 유지
                .build();
    }

    // Refresh Token 검증 및 회원 조회
    private Member validateAndGetMemberFromRefreshToken(String refreshTokenValue) {
        // Refresh Token 검증
        if (!jwtUtil.validateToken(refreshTokenValue)) {
            throw new IllegalArgumentException("유효하지 않은 Refresh Token입니다");
        }

        // Refresh Token에서 사용자 ID 추출
        Long userId = jwtUtil.extractUserId(refreshTokenValue);

        // DB에서 Refresh Token 확인
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Refresh Token입니다"));

        // Refresh Token 만료 확인
        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new IllegalArgumentException("만료된 Refresh Token입니다");
        }

        // 회원 정보 조회
        return memberRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다"));
    }

    // 로그아웃 (Refresh Token 삭제)
    @Override
    public void logout(Long userId) {
        log.info("로그아웃 요청: userId={}", userId);

        // 해당 회원의 모든 Refresh Token 삭제
        refreshTokenRepository.deleteByMemberId(userId);

        log.info("로그아웃 완료: userId={}", userId);
    }
}
