package com.fullStc.security.service;

import java.util.Map;
import java.util.Optional;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;

import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.dto.MemberDTO;
import com.fullStc.member.repository.MemberRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class CustomOAuth2UserServiceImpl extends DefaultOAuth2UserService implements CustomOAuth2UserService {

    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        log.info("OAuth2 사용자 정보 로드 시작");
        
        // 부모 클래스의 메서드를 호출하여 OAuth2 사용자 정보 가져오기 (재시도 로직 포함)
        OAuth2User oAuth2User = loadUserWithRetry(userRequest);
        
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        log.info("OAuth2 Provider: {}", registrationId);
        
        // OAuth2 사용자 정보 추출
        Map<String, Object> attributes = oAuth2User.getAttributes();
        log.info("OAuth2 사용자 정보: {}", attributes);
        
        // Provider별로 사용자 정보 파싱
        String providerId;
        String email;
        String nickname;
        
        switch (registrationId.toLowerCase()) {
            case "kakao":
                providerId = String.valueOf(attributes.get("id"));
                @SuppressWarnings("unchecked")
                Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
                @SuppressWarnings("unchecked")
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                email = (String) kakaoAccount.get("email");
                nickname = (String) profile.get("nickname");
                break;
                
            case "naver":
                @SuppressWarnings("unchecked")
                Map<String, Object> naverResponse = (Map<String, Object>) attributes.get("response");
                
                // null 체크 추가
                if (naverResponse == null) {
                    log.error("네이버 사용자 정보 응답이 null입니다. attributes: {}", attributes);
                    OAuth2Error oauth2Error = new OAuth2Error("naver_response_null", 
                        "네이버 사용자 정보를 가져올 수 없습니다", null);
                    throw new OAuth2AuthenticationException(oauth2Error);
                }
                
                providerId = String.valueOf(naverResponse.get("id"));
                email = (String) naverResponse.get("email");
                nickname = (String) naverResponse.get("nickname");
                
                // 필수 필드 검증
                if (providerId == null || "null".equals(providerId) || providerId.isEmpty()) {
                    log.error("네이버 providerId가 없습니다. naverResponse: {}", naverResponse);
                    OAuth2Error oauth2Error = new OAuth2Error("naver_provider_id_missing", 
                        "네이버 사용자 ID를 가져올 수 없습니다", null);
                    throw new OAuth2AuthenticationException(oauth2Error);
                }
                
                if (email == null || email.isEmpty()) {
                    log.error("네이버 email이 없습니다. naverResponse: {}", naverResponse);
                    OAuth2Error oauth2Error = new OAuth2Error("naver_email_missing", 
                        "네이버 이메일 정보를 가져올 수 없습니다", null);
                    throw new OAuth2AuthenticationException(oauth2Error);
                }
                
                if (nickname == null || nickname.isEmpty()) {
                    nickname = (String) naverResponse.get("name");
                    if (nickname == null || nickname.isEmpty()) {
                        nickname = email.split("@")[0]; // 이메일 앞부분을 닉네임으로 사용
                    }
                }
                break;
                
            case "google":
                providerId = String.valueOf(attributes.get("sub"));
                email = (String) attributes.get("email");
                nickname = (String) attributes.get("name");
                if (nickname == null || nickname.isEmpty()) {
                    nickname = email != null ? email.split("@")[0] : "user";
                }
                break;
                
            default:
                OAuth2Error oauth2Error = new OAuth2Error("unsupported_provider", 
                    "지원하지 않는 OAuth2 Provider입니다: " + registrationId, null);
                throw new OAuth2AuthenticationException(oauth2Error);
        }
        
        log.info("OAuth2 사용자 정보 파싱: provider={}, providerId={}, email={}, nickname={}", 
                registrationId, providerId, email, nickname);
        
        // 기존 회원 조회 (provider와 providerId로)
        Optional<Member> existingMember = memberRepository.findByProviderAndProviderId(registrationId, providerId);
        
        Member member;
        if (existingMember.isPresent()) {
            // 기존 회원인 경우
            member = existingMember.get();
            log.info("기존 {} 회원 로그인: id={}, email={}", registrationId, member.getId(), member.getEmail());
        } else {
            // 신규 회원인 경우
            // 이메일 중복 확인 (다른 provider로 가입한 경우)
            Optional<Member> memberByEmail = memberRepository.findByEmail(email);
            if (memberByEmail.isPresent()) {
                OAuth2Error oauth2Error = new OAuth2Error("email_already_exists", 
                    "이미 다른 방법으로 가입된 이메일입니다: " + email, null);
                throw new OAuth2AuthenticationException(oauth2Error);
            }
            
            // 닉네임 중복 확인 및 처리 (랜덤 값 사용)
            String finalNickname = nickname;
            Random random = new Random();
            int maxAttempts = 100; // 최대 시도 횟수 (무한 루프 방지)
            int attempts = 0;
            
            while (memberRepository.existsByNickname(finalNickname) && attempts < maxAttempts) {
                // 랜덤 문자열 생성 (영문 소문자 + 숫자, 6자리)
                String randomSuffix = generateRandomString(6, random);
                finalNickname = nickname + "_" + randomSuffix;
                attempts++;
            }
            
            // 최대 시도 횟수를 초과한 경우 타임스탬프 사용
            if (memberRepository.existsByNickname(finalNickname)) {
                finalNickname = nickname + "_" + System.currentTimeMillis();
            }
            
            // 신규 회원 생성
            member = Member.builder()
                    .email(email)
                    .password(null) // 소셜 로그인은 비밀번호 없음
                    .nickname(finalNickname)
                    .provider(registrationId) // 동적으로 provider 설정
                    .providerId(providerId)
                    .enabled(true)
                    .build();
            
            // 기본 권한 추가
            member.addRole(MemberRole.USER);
            
            member = memberRepository.save(member);
            log.info("신규 {} 회원 가입: id={}, email={}, nickname={}", 
                    registrationId, member.getId(), member.getEmail(), member.getNickname());
        }
        
        // MemberDTO 생성
        MemberDTO memberDTO = MemberDTO.builder()
                .id(member.getId())
                .email(member.getEmail())
                .password(null)
                .nickname(member.getNickname())
                .provider(member.getProvider())
                .enabled(member.isEnabled())
                .roleNames(member.getMemberRoleList().stream()
                        .map(role -> role.name())
                        .toList())
                .build();
        
        return memberDTO;
    }
    
    /**
     * OAuth2 API 요청 제한(429) 에러 발생 시 재시도 로직이 포함된 사용자 정보 로드
     * Exponential Backoff 방식으로 최대 3회 재시도
     */
    private OAuth2User loadUserWithRetry(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        int maxRetries = 3;
        long initialDelayMs = 1000; // 1초
        long maxDelayMs = 10000; // 최대 10초
        
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return super.loadUser(userRequest);
            } catch (OAuth2AuthenticationException e) {
                // 429 Too Many Requests 에러인지 확인
                if (isRateLimitError(e) && attempt < maxRetries) {
                    long delayMs = Math.min(initialDelayMs * (long) Math.pow(2, attempt), maxDelayMs);
                    String provider = userRequest.getClientRegistration().getRegistrationId();
                    log.warn("{} API 요청 제한 초과 (429). {}ms 후 재시도합니다. (시도 {}/{})", 
                            provider, delayMs, attempt + 1, maxRetries);
                    
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        OAuth2Error oauth2Error = new OAuth2Error("interrupted", "재시도 중 인터럽트 발생", null);
                        throw new OAuth2AuthenticationException(oauth2Error, e);
                    }
                    continue;
                }
                // 429 에러가 아니거나 재시도 횟수를 초과한 경우 예외를 그대로 전파
                throw e;
            }
        }
        
        // 이 코드는 실행되지 않아야 하지만 컴파일러를 위해 추가
        OAuth2Error oauth2Error = new OAuth2Error("max_retries_exceeded", "OAuth2 API 요청 실패: 최대 재시도 횟수 초과", null);
        throw new OAuth2AuthenticationException(oauth2Error);
    }
    
    /**
     * 예외가 429 Rate Limit 에러인지 확인
     */
    private boolean isRateLimitError(OAuth2AuthenticationException exception) {
        Throwable cause = exception.getCause();
        
        // HttpClientErrorException 확인
        if (cause instanceof HttpClientErrorException) {
            HttpClientErrorException httpException = (HttpClientErrorException) cause;
            if (httpException.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                return true;
            }
        }
        
        // 중첩된 예외 확인
        if (cause != null) {
            Throwable nestedCause = cause.getCause();
            if (nestedCause instanceof HttpClientErrorException) {
                HttpClientErrorException httpException = (HttpClientErrorException) nestedCause;
                if (httpException.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    return true;
                }
            }
        }
        
        // 메시지에서 에러 코드 확인 (카카오 에러 코드: KOE237 등)
        String message = exception.getMessage();
        if (message != null) {
            if (message.contains("KOE237") || 
                message.contains("rate limit") || 
                message.contains("TooManyRequests") ||
                message.contains("429")) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 랜덤 문자열 생성 (영문 소문자 + 숫자)
     * @param length 생성할 문자열 길이
     * @param random Random 인스턴스
     * @return 랜덤 문자열
     */
    private String generateRandomString(int length, Random random) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
