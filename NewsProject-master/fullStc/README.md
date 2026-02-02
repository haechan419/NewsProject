# FullStc - Backend Application

Spring Boot 기반 백엔드 애플리케이션입니다.

## 기술 스택

- **Spring Boot 3.5.9** - 백엔드 프레임워크
- **Java 21** - 프로그래밍 언어
- **Spring Security** - 인증/인가 보안 프레임워크
- **Spring Data JPA** - 데이터베이스 ORM
- **JWT (jjwt 0.11.5)** - 토큰 기반 인증
- **MariaDB** - 관계형 데이터베이스
- **Lombok** - 보일러플레이트 코드 감소
- **SpringDoc OpenAPI** - API 문서화 (Swagger)
- **Gradle** - 빌드 도구

## 프로젝트 구조

```
fullStc/
├── src/
│   ├── main/
│   │   ├── java/com/fullStc/
│   │   │   ├── config/          # 설정 클래스
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── OpenApiConfig.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   ├── member/           # 회원 관련
│   │   │   │   ├── controller/   # REST 컨트롤러
│   │   │   │   ├── service/      # 비즈니스 로직
│   │   │   │   ├── repository/   # 데이터 접근 계층
│   │   │   │   ├── domain/       # 엔티티
│   │   │   │   └── dto/          # 데이터 전송 객체
│   │   │   ├── security/         # 보안 관련
│   │   │   │   ├── filter/       # JWT 필터
│   │   │   │   └── handler/      # 인증/인가 핸들러
│   │   │   └── util/             # 유틸리티
│   │   └── resources/
│   │       ├── application.properties
│   │       └── logback-spring.xml
│   └── test/                     # 테스트 코드
├── build.gradle
└── settings.gradle
```

## 시작하기

### 사전 요구사항

- Java 21 이상
- Gradle
- MariaDB

### 데이터베이스 설정

1. MariaDB 데이터베이스 생성
2. `src/main/resources/application.properties` 파일 설정 (또는 환경 변수 사용)

### 환경 변수 설정

보안을 위해 다음 환경 변수를 설정하는 것을 권장합니다:

```bash
# JWT 설정
export JWT_SECRET=your-secret-key-here
export JWT_ACCESS_EXPIRATION=900000  # 15분 (밀리초)
export JWT_REFRESH_EXPIRATION=604800000  # 7일 (밀리초)

# 데이터베이스 설정
export DB_URL=jdbc:mariadb://localhost:3306/your_database
export DB_USERNAME=your_username
export DB_PASSWORD=your_password

# 보안 설정
export APP_SECURITY_HTTPS_ENABLED=false
```

### 애플리케이션 실행

```bash
./gradlew bootRun
```

Windows의 경우:

```bash
gradlew.bat bootRun
```

애플리케이션은 기본적으로 `http://localhost:8080`에서 실행됩니다.

### 테스트 실행

```bash
./gradlew test
```

## 주요 기능

### 인증/인가
- **회원가입**: 이메일, 닉네임 중복 검사
- **로그인**: JWT 토큰 발급 (Access Token, Refresh Token)
- **토큰 갱신**: Refresh Token을 사용한 Access Token 갱신
- **로그아웃**: Refresh Token 무효화

### 보안 기능
- JWT 기반 인증
- Spring Security를 사용한 인가
- CSRF 보호
- 보안 HTTP 헤더 설정
- XSS 방지

### API 문서화
- Swagger UI를 통한 API 문서 제공
- 접속 URL: `http://localhost:8080/swagger-ui.html`

## API 엔드포인트

### 인증 API (`/api/auth`)

- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃

### 사용자 API (`/api/user`)

- `GET /api/user/me` - 현재 사용자 정보 조회

자세한 API 문서는 Swagger UI에서 확인할 수 있습니다.

## 데이터베이스

### 주요 엔티티

- **Member**: 회원 정보
- **RefreshToken**: 리프레시 토큰 저장
- **MemberCategory**: 회원 관심 카테고리

## 보안 고려사항

프로젝트에 적용된 보안 개선 사항은 [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md)를 참고하세요.

주요 보안 기능:
- JWT Access Token 만료 시간: 15분
- JWT Refresh Token 만료 시간: 7일
- 민감한 정보 환경 변수 분리
- 보안 HTTP 헤더 설정
- Cookie 기반 토큰 저장 (HttpOnly, Secure 옵션)

## 빌드

### JAR 파일 생성

```bash
./gradlew bootJar
```

생성된 JAR 파일은 `build/libs/` 디렉토리에 있습니다.

## 추가 문서

- [보안 개선 사항](./SECURITY_IMPROVEMENTS.md)
- [토큰 만료 가이드](./TOKEN_EXPIRATION_GUIDE.md)
- [Swagger 테스트 순서](./docs/SWAGGER_TEST_ORDER.md)
- [테스트 실행 순서](./docs/TEST_EXECUTION_ORDER.md)
