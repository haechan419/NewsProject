package com.fullStc.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.RefreshToken;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.dto.RefreshTokenRequestDTO;
import com.fullStc.member.dto.SignUpDTO;
import com.fullStc.member.dto.TokenDTO;
import com.fullStc.member.repository.BaseRepositoryTest;
import com.fullStc.member.repository.RefreshTokenRepository;
import com.fullStc.member.repository.TestHelper;
import com.fullStc.util.JwtUtil;

// AuthService 테스트 클래스
public class AuthServiceTests extends BaseRepositoryTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // 회원가입 성공
    @Test
    public void testSignUp_Success() {
        // given
        SignUpDTO signUpDTO = SignUpDTO.builder()
                .email(TestHelper.generateUniqueEmail("signup"))
                .password("Test1234!")
                .nickname(TestHelper.generateUniqueNickname("SignUpUser"))
                .build();

        // when
        Long userId = authService.signUp(signUpDTO);

        // then
        assertThat(userId).isNotNull();
        Member savedMember = memberRepository.findById(userId).orElse(null);
        assertThat(savedMember).isNotNull();
        assertThat(savedMember.getEmail()).isEqualTo(signUpDTO.getEmail());
        assertThat(savedMember.getNickname()).isEqualTo(signUpDTO.getNickname());
        assertThat(savedMember.getProvider()).isEqualTo("local");
        assertThat(savedMember.getMemberRoleList()).contains(MemberRole.USER);
        log.info("회원가입 성공: userId={}, email={}", userId, savedMember.getEmail());
    }

    // 회원가입 실패 - 이메일 중복
    @Test
    public void testSignUp_DuplicateEmail() {
        // given
        String email = TestHelper.generateUniqueEmail("duplicate");
        TestHelper.createMember(memberRepository, passwordEncoder, email, "ExistingUser");

        SignUpDTO signUpDTO = SignUpDTO.builder()
                .email(email)
                .password("Test1234!")
                .nickname(TestHelper.generateUniqueNickname("NewUser"))
                .build();

        // when & then
        assertThatThrownBy(() -> authService.signUp(signUpDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 존재하는 이메일입니다");
        log.info("이메일 중복 검증 성공");
    }

    // 회원가입 실패 - 닉네임 중복
    @Test
    public void testSignUp_DuplicateNickname() {
        // given
        String nickname = TestHelper.generateUniqueNickname("duplicate");
        TestHelper.createMember(memberRepository, passwordEncoder, TestHelper.generateUniqueEmail("existing"), nickname);

        SignUpDTO signUpDTO = SignUpDTO.builder()
                .email(TestHelper.generateUniqueEmail("new"))
                .password("Test1234!")
                .nickname(nickname)
                .build();

        // when & then
        assertThatThrownBy(() -> authService.signUp(signUpDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 존재하는 닉네임입니다");
        log.info("닉네임 중복 검증 성공");
    }

    // Refresh Token으로 Access Token 갱신 성공
    @Test
    public void testRefreshToken_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("refresh");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "RefreshUser");

        // Refresh Token 생성 및 DB 저장
        String refreshTokenValue = jwtUtil.generateRefreshToken(member.getId());
        RefreshToken refreshToken = RefreshToken.builder()
                .member(member)
                .token(refreshTokenValue)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(refreshToken);

        RefreshTokenRequestDTO requestDTO = RefreshTokenRequestDTO.builder()
                .refreshToken(refreshTokenValue)
                .build();

        // when
        TokenDTO tokenDTO = authService.refreshToken(requestDTO);

        // then
        assertThat(tokenDTO).isNotNull();
        assertThat(tokenDTO.getAccessToken()).isNotNull();
        assertThat(tokenDTO.getRefreshToken()).isEqualTo(refreshTokenValue);
        assertThat(jwtUtil.validateToken(tokenDTO.getAccessToken())).isTrue();
        log.info("토큰 갱신 성공: accessToken 존재 여부={}", tokenDTO.getAccessToken() != null);
    }

    // Refresh Token 갱신 실패 - 유효하지 않은 토큰
    @Test
    public void testRefreshToken_InvalidToken() {
        // given
        RefreshTokenRequestDTO requestDTO = RefreshTokenRequestDTO.builder()
                .refreshToken("invalid-token")
                .build();

        // when & then
        assertThatThrownBy(() -> authService.refreshToken(requestDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 Refresh Token입니다");
        log.info("유효하지 않은 토큰 검증 성공");
    }

    // Refresh Token 갱신 실패 - DB에 존재하지 않는 토큰
    @Test
    public void testRefreshToken_TokenNotFoundInDB() {
        // given
        String email = TestHelper.generateUniqueEmail("notfound");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "NotFoundUser");

        // DB에 저장하지 않은 Refresh Token 생성
        String refreshTokenValue = jwtUtil.generateRefreshToken(member.getId());

        RefreshTokenRequestDTO requestDTO = RefreshTokenRequestDTO.builder()
                .refreshToken(refreshTokenValue)
                .build();

        // when & then
        assertThatThrownBy(() -> authService.refreshToken(requestDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("존재하지 않는 Refresh Token입니다");
        log.info("DB에 존재하지 않는 토큰 검증 성공");
    }

    // Refresh Token 갱신 실패 - 만료된 토큰
    @Test
    public void testRefreshToken_ExpiredToken() {
        // given
        String email = TestHelper.generateUniqueEmail("expired");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "ExpiredUser");

        // 만료된 Refresh Token 생성 및 DB 저장
        String refreshTokenValue = jwtUtil.generateRefreshToken(member.getId());
        RefreshToken refreshToken = RefreshToken.builder()
                .member(member)
                .token(refreshTokenValue)
                .expiryDate(LocalDateTime.now().minusDays(1)) // 만료됨
                .build();
        refreshTokenRepository.save(refreshToken);

        RefreshTokenRequestDTO requestDTO = RefreshTokenRequestDTO.builder()
                .refreshToken(refreshTokenValue)
                .build();

        // when & then
        assertThatThrownBy(() -> authService.refreshToken(requestDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("만료된 Refresh Token입니다");
        log.info("만료된 토큰 검증 성공");
    }

    // 로그아웃 성공
    @Test
    public void testLogout_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("logout");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, "LogoutUser");

        // Refresh Token 여러 개 생성
        RefreshToken token1 = RefreshToken.builder()
                .member(member)
                .token("logout-token-1")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        RefreshToken token2 = RefreshToken.builder()
                .member(member)
                .token("logout-token-2")
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(token1);
        refreshTokenRepository.save(token2);

        // when
        authService.logout(member.getId());

        // then
        List<RefreshToken> tokens = refreshTokenRepository.findByMemberId(member.getId());
        assertThat(tokens).isEmpty();
        log.info("로그아웃 성공: 모든 RefreshToken 삭제됨");
    }
}
