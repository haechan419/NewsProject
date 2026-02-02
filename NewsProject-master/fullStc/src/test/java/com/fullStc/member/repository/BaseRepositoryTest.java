package com.fullStc.member.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.fullStc.config.TestConfig;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Repository 테스트를 위한 베이스 클래스
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
@Import(TestConfig.class)
public abstract class BaseRepositoryTest {

    // 하위 클래스에서 log 사용을 위해 protected로 선언
    protected final Logger log = LoggerFactory.getLogger(getClass());

    @Autowired
    protected MemberRepository memberRepository;

    @Autowired
    protected PasswordEncoder passwordEncoder;
}
