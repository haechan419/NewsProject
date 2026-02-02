package com.fullStc;

import java.nio.charset.StandardCharsets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableJpaAuditing // JPA Auditing을 활성화(생성일, 수정일 자동 관리)
public class FullStcApplication {

	public static void main(String[] args) {
		// JVM 인코딩 강제 설정
		System.setProperty("file.encoding", "UTF-8");
		System.setProperty("console.encoding", "UTF-8");
		System.setProperty("user.language", "ko");
		System.setProperty("user.country", "KR");
		
		// 표준 출력/에러 스트림 인코딩 설정
		System.setOut(new java.io.PrintStream(System.out, true, StandardCharsets.UTF_8));
		System.setErr(new java.io.PrintStream(System.err, true, StandardCharsets.UTF_8));
		
		SpringApplication.run(FullStcApplication.class, args);
	}

}
