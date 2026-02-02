# 2W Project

풀스택 웹 애플리케이션 프로젝트입니다. React 기반 프론트엔드와 Spring Boot 기반 백엔드로 구성되어 있습니다.

## 📋 프로젝트 개요

이 프로젝트는 사용자 인증/인가 기능을 포함한 풀스택 웹 애플리케이션입니다.

### 주요 기능
- 사용자 인증 (로그인/로그아웃)
- JWT 기반 토큰 인증
- 사용자 정보 관리
- 보호된 라우트 (Protected Route)

## 🏗️ 프로젝트 구조

```
2Wproject/
├── fstac/          # 프론트엔드 (React + Vite)
└── fullStc/        # 백엔드 (Spring Boot)
```

## 🛠️ 기술 스택

### Frontend (`fstac/`)
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **Redux Toolkit** - 상태 관리
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트

### Backend (`fullStc/`)
- **Spring Boot 3.5.9** - 백엔드 프레임워크
- **Java 21** - 프로그래밍 언어
- **Spring Security** - 보안
- **Spring Data JPA** - 데이터베이스 ORM
- **JWT (jjwt)** - 토큰 기반 인증
- **MariaDB** - 데이터베이스
- **Lombok** - 보일러플레이트 코드 감소
- **SpringDoc OpenAPI** - API 문서화

## 🚀 시작하기

### 사전 요구사항
- Node.js (v18 이상)
- Java 21
- Gradle
- MariaDB

### 프론트엔드 실행

```bash
cd fstac
npm install
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 백엔드 실행

```bash
cd fullStc
./gradlew bootRun
```

또는 Windows의 경우:

```bash
cd fullStc
gradlew.bat bootRun
```

백엔드는 기본적으로 `http://localhost:8080`에서 실행됩니다.

## 📁 각 프로젝트 상세 정보

- [프론트엔드 상세 정보](./fstac/README.md)
- [백엔드 상세 정보](./fullStc/README.md)

## 🔧 개발 환경 설정

### 환경 변수

프론트엔드와 백엔드 모두 환경 변수 설정이 필요할 수 있습니다. 각 프로젝트의 README를 참고하세요.

## 📝 API 문서

백엔드 서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## 📄 라이선스

이 프로젝트는 개인 포트폴리오용 프로젝트입니다.
