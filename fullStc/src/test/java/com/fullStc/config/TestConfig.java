package com.fullStc.config;

import org.springframework.boot.test.context.TestConfiguration;

// 테스트용 설정 클래스
// PasswordEncoder는 SecurityConfig에서 정의되므로 여기서는 제거
@TestConfiguration
public class TestConfig {
    // SecurityConfig의 PasswordEncoder 빈을 사용
}
