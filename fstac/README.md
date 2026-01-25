# FSTAC - Frontend Application

React 기반 프론트엔드 애플리케이션입니다.

## 기술 스택

- **React 18** - UI 라이브러리
- **Vite** - 빠른 빌드 도구
- **Redux Toolkit** - 전역 상태 관리
- **React Router v6** - 클라이언트 사이드 라우팅
- **Axios** - HTTP 클라이언트
- **Vitest** - 테스트 프레임워크

## 프로젝트 구조

```
fstac/
├── public/          # 정적 파일
├── src/
│   ├── api/         # API 호출 함수
│   ├── components/  # 재사용 가능한 컴포넌트
│   ├── hooks/       # 커스텀 훅
│   ├── layouts/     # 레이아웃 컴포넌트
│   ├── pages/       # 페이지 컴포넌트
│   ├── router/      # 라우터 설정
│   ├── slices/      # Redux 슬라이스
│   └── util/        # 유틸리티 함수
├── package.json
└── vite.config.js
```

## 시작하기

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

### 빌드 미리보기

```bash
npm run preview
```

## 주요 기능

- **인증/인가**: JWT 토큰 기반 사용자 인증
- **상태 관리**: Redux Toolkit을 사용한 전역 상태 관리
- **보호된 라우트**: 인증이 필요한 페이지 보호
- **API 통신**: Axios를 사용한 백엔드 API 호출

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하여 다음 변수들을 설정할 수 있습니다:

```
VITE_API_BASE_URL=http://localhost:8080
```

## 테스트

```bash
npm test
```

## 주요 페이지

- `/login` - 로그인 페이지
- `/` - 홈 페이지 (인증 필요)

## API 엔드포인트

프론트엔드는 다음 백엔드 API를 사용합니다:

- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/signup` - 회원가입
- `GET /api/user/me` - 현재 사용자 정보 조회
