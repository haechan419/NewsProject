# 보안 개선 사항

이 문서는 프로젝트에 적용된 보안 개선 사항을 설명합니다.

## 적용된 보안 개선 사항

### 1. 민감한 정보 환경 변수 분리 ✅
- **문제**: JWT secret과 DB 비밀번호가 `application.properties`에 하드코딩되어 있었음
- **해결**: 환경 변수로 분리하여 Git에 커밋되지 않도록 개선
- **설정 방법**:
  ```bash
  # 환경 변수로 설정
  export JWT_SECRET=your-secret-key-here
  export DB_PASSWORD=your-db-password
  export DB_USERNAME=your-db-username
  export DB_URL=your-db-url
  ```

### 2. 보안 HTTP 헤더 추가 ✅
- **X-Frame-Options: DENY**: 클릭재킹 공격 방지
- **X-Content-Type-Options: nosniff**: MIME 타입 스니핑 방지
- **Strict-Transport-Security (HSTS)**: HTTPS 강제 사용 (1년)

### 3. JWT Access Token 만료 시간 단축 ✅
- **변경 전**: 1일 (86400000ms)
- **변경 후**: 15분 (900000ms)
- **이유**: 토큰이 탈취되어도 피해 범위를 최소화

### 4. localStorage에서 토큰 제거 ✅
- **문제**: localStorage에 토큰을 저장하면 XSS 공격에 취약
- **해결**: HttpOnly 쿠키만 사용하도록 변경
- **장점**: JavaScript로 접근 불가능하여 XSS 공격으로부터 보호

### 5. JWT 클레임에서 password 제거 ✅
- **문제**: JWT 토큰에 password가 포함될 수 있었음
- **해결**: JWT 클레임에서 password 완전 제거
- **영향**: `JwtUtil.java`와 `JwtCheckFilter.java`에서 password 관련 코드 제거

### 6. .gitignore 업데이트 ✅
- `.env` 파일과 환경 변수 관련 파일이 Git에 커밋되지 않도록 설정

## 추가 권장 사항

### Rate Limiting (로그인 시도 제한)
- **현재 상태**: 미구현
- **권장 사항**: 로그인 실패 시 일정 시간 동안 로그인 시도 제한
- **구현 방법**: 
  - Bucket4j 라이브러리 사용
  - 또는 Redis를 이용한 분산 Rate Limiting

### 프로덕션 환경 설정
1. **HTTPS 강제 사용**:
   ```properties
   app.security.https-enabled=true
   ```

2. **강력한 JWT Secret**:
   - 최소 64자 이상의 랜덤 문자열 사용
   - 환경 변수로 관리

3. **CORS 설정 제한**:
   - 프로덕션 도메인만 허용
   - 개발 환경과 분리

4. **로깅 개선**:
   - 민감한 정보(비밀번호, 토큰 등)가 로그에 남지 않도록 주의
   - 보안 이벤트(로그인 실패, 권한 거부 등) 로깅

5. **데이터베이스 보안**:
   - 최소 권한 원칙 적용
   - 연결 암호화
   - 정기적인 백업

## 환경 변수 설정 예시

프로덕션 환경에서는 다음과 같이 환경 변수를 설정하세요:

```bash
# 데이터베이스
export DB_URL=jdbc:mariadb://your-db-host:3306/your-db
export DB_USERNAME=your-username
export DB_PASSWORD=your-strong-password

# JWT
export JWT_SECRET=your-very-long-and-random-secret-key-minimum-64-characters
export JWT_ACCESS_TOKEN_EXPIRATION=900000  # 15분
export JWT_REFRESH_TOKEN_EXPIRATION=604800000  # 7일

# 보안
export app.security.https-enabled=true

# CORS
export app.cors.allowed-origins=https://your-production-domain.com
```

## 보안 체크리스트

- [x] 민감한 정보 환경 변수 분리
- [x] 보안 HTTP 헤더 설정
- [x] JWT 토큰 만료 시간 단축
- [x] localStorage에서 토큰 제거
- [x] JWT 클레임에서 password 제거
- [x] .gitignore 업데이트
- [ ] Rate Limiting 구현
- [ ] 프로덕션 환경 HTTPS 설정
- [ ] 보안 로깅 강화
- [ ] 정기적인 보안 감사
