package com.fullStc.security.service;

import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;

// OAuth2 사용자 정보 로드를 위한 서비스 인터페이스
public interface CustomOAuth2UserService extends OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    // OAuth2 사용자 정보 로드
    OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException;
}
