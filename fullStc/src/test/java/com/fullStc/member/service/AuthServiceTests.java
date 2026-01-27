package com.fullStc.member.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.PasswordResetToken;
import com.fullStc.member.domain.RefreshToken;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.dto.FindEmailDTO;
import com.fullStc.member.dto.FindPasswordDTO;
import com.fullStc.member.dto.RefreshTokenRequestDTO;
import com.fullStc.member.dto.ResetPasswordDTO;
import com.fullStc.member.dto.SignUpDTO;
import com.fullStc.member.dto.TokenDTO;
import com.fullStc.member.repository.BaseRepositoryTest;
import com.fullStc.member.repository.MemberCategoryRepository;
import com.fullStc.member.repository.PasswordResetTokenRepository;
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
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private MemberCategoryRepository memberCategoryRepository;

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

    // 회원가입 성공 - 카테고리 포함
    @Test
    public void testSignUp_WithCategories() {
        // given
        SignUpDTO signUpDTO = SignUpDTO.builder()
                .email(TestHelper.generateUniqueEmail("signupcat"))
                .password("Test1234!")
                .nickname(TestHelper.generateUniqueNickname("SignUpCatUser"))
                .categories(Arrays.asList("정치", "경제", "엔터"))
                .build();

        // when
        Long userId = authService.signUp(signUpDTO);

        // then
        assertThat(userId).isNotNull();
        Member savedMember = memberRepository.findById(userId).orElse(null);
        assertThat(savedMember).isNotNull();
        
        // 카테고리 확인
        List<com.fullStc.member.domain.MemberCategory> categories = memberCategoryRepository.findByMemberId(userId);
        assertThat(categories).hasSize(3);
        assertThat(categories).extracting(com.fullStc.member.domain.MemberCategory::getCategory)
                .containsExactlyInAnyOrder("정치", "경제", "엔터");
        log.info("회원가입 성공 (카테고리 포함): userId={}, categories={}", userId, 
                categories.stream().map(com.fullStc.member.domain.MemberCategory::getCategory).toList());
    }

    // 회원가입 실패 - 유효하지 않은 카테고리
    @Test
    public void testSignUp_InvalidCategory() {
        // given
        SignUpDTO signUpDTO = SignUpDTO.builder()
                .email(TestHelper.generateUniqueEmail("invalidcat"))
                .password("Test1234!")
                .nickname(TestHelper.generateUniqueNickname("InvalidCatUser"))
                .categories(Arrays.asList("InvalidCategory"))
                .build();

        // when & then
        assertThatThrownBy(() -> authService.signUp(signUpDTO))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 카테고리입니다");
        log.info("유효하지 않은 카테고리 검증 성공");
    }

    // 회원가입 성공 - 카테고리 최대 3개 제한
    @Test
    public void testSignUp_MaxCategories() {
        // given
        SignUpDTO signUpDTO = SignUpDTO.builder()
                .email(TestHelper.generateUniqueEmail("maxcat"))
                .password("Test1234!")
                .nickname(TestHelper.generateUniqueNickname("MaxCatUser"))
                .categories(Arrays.asList("정치", "경제", "엔터", "IT/과학")) // 4개 (최대 3개 초과)
                .build();

        // when
        Long userId = authService.signUp(signUpDTO);

        // then - 최대 3개까지만 저장되어야 함
        List<com.fullStc.member.domain.MemberCategory> categories = memberCategoryRepository.findByMemberId(userId);
        assertThat(categories).hasSize(3); // 최대 3개까지만 저장
        log.info("카테고리 최대 3개 제한 검증 성공: 저장된 카테고리 수={}", categories.size());
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

    // 아이디 찾기 성공
    @Test
    public void testFindEmail_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("findemail");
        String nickname = TestHelper.generateUniqueNickname("FindEmailUser");
        TestHelper.createMember(memberRepository, passwordEncoder, email, nickname);

        FindEmailDTO findEmailDTO = FindEmailDTO.builder()
                .nickname(nickname)
                .build();

        // when
        String foundEmail = authService.findEmail(findEmailDTO);

        // then
        assertThat(foundEmail).isNotNull();
        assertThat(foundEmail).isEqualTo(email); // 전체 이메일 반환 확인
        assertThat(foundEmail).contains("@");
        log.info("아이디 찾기 성공: foundEmail={}", foundEmail);
    }

    // 아이디 찾기 실패 - 존재하지 않는 닉네임
    @Test
    public void testFindEmail_NicknameNotFound() {
        // given
        FindEmailDTO findEmailDTO = FindEmailDTO.builder()
                .nickname("NonExistentUser")
                .build();

        // when & then
        assertThatThrownBy(() -> authService.findEmail(findEmailDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("해당 닉네임으로 등록된 회원을 찾을 수 없습니다");
        log.info("존재하지 않는 닉네임 검증 성공");
    }

    // 아이디 찾기 실패 - 소셜 로그인 계정
    @Test
    public void testFindEmail_SocialAccount() {
        // given
        String email = TestHelper.generateUniqueEmail("social");
        String nickname = TestHelper.generateUniqueNickname("SocialUser");
        TestHelper.createMember(memberRepository, passwordEncoder, email, nickname, "kakao", "kakao_12345", MemberRole.USER);

        FindEmailDTO findEmailDTO = FindEmailDTO.builder()
                .nickname(nickname)
                .build();

        // when & then
        assertThatThrownBy(() -> authService.findEmail(findEmailDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("소셜 로그인 계정은 이메일 찾기를 사용할 수 없습니다");
        log.info("소셜 로그인 계정 검증 성공");
    }

    // 비밀번호 찾기 성공
    @Test
    public void testRequestPasswordReset_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("reset");
        String nickname = TestHelper.generateUniqueNickname("ResetUser");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, nickname);

        FindPasswordDTO findPasswordDTO = FindPasswordDTO.builder()
                .email(email)
                .build();

        // when
        String token = authService.requestPasswordReset(findPasswordDTO);

        // then
        assertThat(token).isNotNull();
        assertThat(token).isNotEmpty();
        List<PasswordResetToken> tokens = passwordResetTokenRepository.findByMemberId(member.getId());
        assertThat(tokens).hasSize(1);
        assertThat(tokens.get(0).getToken()).isEqualTo(token);
        assertThat(tokens.get(0).isUsed()).isFalse();
        assertThat(tokens.get(0).isExpired()).isFalse();
        log.info("비밀번호 재설정 요청 성공: token={}", token);
    }

    // 비밀번호 찾기 실패 - 존재하지 않는 이메일
    @Test
    public void testRequestPasswordReset_EmailNotFound() {
        // given
        FindPasswordDTO findPasswordDTO = FindPasswordDTO.builder()
                .email("nonexistent@test.com")
                .build();

        // when & then
        assertThatThrownBy(() -> authService.requestPasswordReset(findPasswordDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("해당 이메일로 등록된 회원을 찾을 수 없습니다");
        log.info("존재하지 않는 이메일 검증 성공");
    }

    // 비밀번호 찾기 실패 - 소셜 로그인 계정
    @Test
    public void testRequestPasswordReset_SocialAccount() {
        // given
        String email = TestHelper.generateUniqueEmail("socialreset");
        String nickname = TestHelper.generateUniqueNickname("SocialResetUser");
        TestHelper.createMember(memberRepository, passwordEncoder, email, nickname, "naver", "naver_12345", MemberRole.USER);

        FindPasswordDTO findPasswordDTO = FindPasswordDTO.builder()
                .email(email)
                .build();

        // when & then
        assertThatThrownBy(() -> authService.requestPasswordReset(findPasswordDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("소셜 로그인 계정은 비밀번호 재설정을 사용할 수 없습니다");
        log.info("소셜 로그인 계정 비밀번호 재설정 검증 성공");
    }

    // 비밀번호 재설정 성공
    @Test
    public void testResetPassword_Success() {
        // given
        String email = TestHelper.generateUniqueEmail("resetpass");
        String nickname = TestHelper.generateUniqueNickname("ResetPassUser");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, nickname, "local", null, MemberRole.USER);
        String oldPassword = member.getPassword();

        // 비밀번호 재설정 토큰 생성
        FindPasswordDTO findPasswordDTO = FindPasswordDTO.builder()
                .email(email)
                .build();
        String token = authService.requestPasswordReset(findPasswordDTO);

        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token).orElse(null);
        assertThat(resetToken).isNotNull();

        ResetPasswordDTO resetPasswordDTO = ResetPasswordDTO.builder()
                .token(resetToken.getToken())
                .newPassword("NewPass1234!")
                .build();

        // when
        authService.resetPassword(resetPasswordDTO);

        // then
        Member updatedMember = memberRepository.findById(member.getId()).orElse(null);
        assertThat(updatedMember).isNotNull();
        assertThat(updatedMember.getPassword()).isNotEqualTo(oldPassword);
        
        PasswordResetToken usedToken = passwordResetTokenRepository.findByToken(resetToken.getToken()).orElse(null);
        assertThat(usedToken).isNotNull();
        assertThat(usedToken.isUsed()).isTrue();
        log.info("비밀번호 재설정 성공: 비밀번호 변경됨");
    }

    // 비밀번호 재설정 실패 - 유효하지 않은 토큰
    @Test
    public void testResetPassword_InvalidToken() {
        // given
        ResetPasswordDTO resetPasswordDTO = ResetPasswordDTO.builder()
                .token("invalid-token")
                .newPassword("NewPass1234!")
                .build();

        // when & then
        assertThatThrownBy(() -> authService.resetPassword(resetPasswordDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("유효하지 않은 토큰입니다");
        log.info("유효하지 않은 토큰 검증 성공");
    }

    // 비밀번호 재설정 실패 - 만료된 토큰
    @Test
    public void testResetPassword_ExpiredToken() {
        // given
        String email = TestHelper.generateUniqueEmail("expiredreset");
        String nickname = TestHelper.generateUniqueNickname("ExpiredResetUser");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, nickname);

        // 만료된 토큰 생성
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .member(member)
                .token("expired-token")
                .expiryDate(LocalDateTime.now().minusHours(1)) // 만료됨
                .used(false)
                .build();
        passwordResetTokenRepository.save(expiredToken);

        ResetPasswordDTO resetPasswordDTO = ResetPasswordDTO.builder()
                .token("expired-token")
                .newPassword("NewPass1234!")
                .build();

        // when & then
        assertThatThrownBy(() -> authService.resetPassword(resetPasswordDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("만료된 토큰입니다");
        log.info("만료된 토큰 검증 성공");
    }

    // 비밀번호 재설정 실패 - 이미 사용된 토큰
    @Test
    public void testResetPassword_UsedToken() {
        // given
        String email = TestHelper.generateUniqueEmail("usedreset");
        String nickname = TestHelper.generateUniqueNickname("UsedResetUser");
        Member member = TestHelper.createMember(memberRepository, passwordEncoder, email, nickname);

        // 이미 사용된 토큰 생성
        PasswordResetToken usedToken = PasswordResetToken.builder()
                .member(member)
                .token("used-token")
                .expiryDate(LocalDateTime.now().plusHours(1))
                .used(true) // 이미 사용됨
                .build();
        passwordResetTokenRepository.save(usedToken);

        ResetPasswordDTO resetPasswordDTO = ResetPasswordDTO.builder()
                .token("used-token")
                .newPassword("NewPass1234!")
                .build();

        // when & then
        assertThatThrownBy(() -> authService.resetPassword(resetPasswordDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("이미 사용된 토큰입니다");
        log.info("이미 사용된 토큰 검증 성공");
    }
}
