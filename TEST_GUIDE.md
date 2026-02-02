# 테스트 실행 가이드

로그인 및 얼굴 인식 기능에 대한 테스트 코드 실행 가이드입니다.

## 📋 목차

1. [Spring Boot 백엔드 테스트](#1-spring-boot-백엔드-테스트)
2. [React 프론트엔드 테스트](#2-react-프론트엔드-테스트)
3. [Python AI 서버 테스트](#3-python-ai-서버-테스트)
4. [전체 테스트 실행](#4-전체-테스트-실행)
5. [테스트 커버리지](#5-테스트-커버리지)

---

## 1. Spring Boot 백엔드 테스트

### 1.1 사전 준비

```bash
cd fullStc
```

### 1.2 전체 테스트 실행

```bash
# Windows
gradlew.bat test

# Linux/Mac
./gradlew test
```

### 1.3 특정 테스트만 실행

#### 로그인 테스트만 실행
```bash
# Windows
gradlew.bat test --tests "com.fullStc.member.service.AuthServiceTests"

# Linux/Mac
./gradlew test --tests "com.fullStc.member.service.AuthServiceTests"
```

#### 얼굴 인식 테스트만 실행
```bash
# Windows
gradlew.bat test --tests "com.fullStc.ai.service.AiFaceServiceTests"

# Linux/Mac
./gradlew test --tests "com.fullStc.ai.service.AiFaceServiceTests"
```

### 1.4 테스트 결과 확인

테스트 결과는 다음 위치에서 확인할 수 있습니다:
- HTML 리포트: `fullStc/build/reports/tests/test/index.html`
- XML 리포트: `fullStc/build/test-results/test/`

### 1.5 테스트 항목

#### AuthServiceTests (로그인 테스트)
- ✅ 회원가입 성공
- ✅ 이메일 중복 검증
- ✅ 닉네임 중복 검증
- ✅ JWT 토큰 갱신 성공
- ✅ 유효하지 않은 토큰 검증
- ✅ 만료된 토큰 검증
- ✅ 로그아웃 성공

#### AiFaceServiceTests (얼굴 인식 테스트)
- ✅ 얼굴 등록 성공
- ✅ 이미지 데이터 없음 검증
- ✅ 사용자 ID 없음 검증
- ✅ 존재하지 않는 회원 검증
- ✅ 이미지 크기 초과 검증 (10MB)
- ✅ 얼굴 인식 성공 (특정 사용자)
- ✅ 등록된 얼굴 없음 검증
- ✅ 얼굴 데이터 삭제 성공
- ✅ Base64 헤더 제거 처리

---

## 2. React 프론트엔드 테스트

### 2.1 사전 준비

```bash
cd fstac
npm install
```

### 2.2 전체 테스트 실행

```bash
npm test
```

또는 Vitest UI로 실행:
```bash
npm run test:ui
```

### 2.3 특정 테스트만 실행

```bash
# 로그인 테스트만 실행
npm test -- Login.test

# 얼굴 인식 컴포넌트 테스트만 실행
npm test -- FaceRecognitionLogin.test
```

### 2.4 테스트 커버리지 확인

```bash
npm test -- --coverage
```

커버리지 리포트는 `fstac/coverage/` 디렉토리에 생성됩니다.

### 2.5 테스트 항목

#### Login.test.jsx (로그인 컴포넌트)
- ✅ 로그인 폼 렌더링
- ✅ 소셜 로그인 버튼 표시
- ✅ 얼굴 인식 버튼 표시
- ✅ 이메일/비밀번호 입력
- ✅ 유효하지 않은 이메일 검증
- ✅ 비밀번호 비어있음 검증
- ✅ 카메라 활성화
- ✅ 비디오 엘리먼트 표시
- ✅ 자동 얼굴 인식 토글
- ✅ 카메라 권한 거부 에러
- ✅ 로딩 상태 처리
- ✅ 에러 메시지 표시
- ✅ OAuth 로그인 리다이렉트

#### FaceRecognitionLogin.test.jsx (얼굴 인식 컴포넌트)
- ✅ 얼굴 인식 시작 버튼 표시
- ✅ 카메라 활성화 함수 호출
- ✅ 로딩 중 버튼 비활성화
- ✅ 비디오 엘리먼트 렌더링
- ✅ 카메라 준비 중 로딩 메시지
- ✅ 자동 인식 토글 버튼
- ✅ 수동 인식/취소 버튼
- ✅ 자동 인식 ON/OFF 상태
- ✅ 수동 인식 버튼 클릭
- ✅ 인식 중 상태 표시
- ✅ 비디오 준비 안됨 시 버튼 비활성화
- ✅ 카메라 취소 버튼
- ✅ 에러 메시지 표시
- ✅ 성공/실패 메시지 색상
- ✅ 접근성 (버튼 disabled 속성)

---

## 3. Python AI 서버 테스트

### 3.1 사전 준비

```bash
cd python-ai

# 가상환경 활성화 (이미 생성되어 있다면)
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# 테스트 라이브러리 설치 (이미 설치되어 있다면 생략)
pip install pytest pytest-asyncio httpx
```

### 3.2 전체 테스트 실행

```bash
pytest
```

상세 출력과 함께 실행:
```bash
pytest -v -s
```

### 3.3 특정 테스트만 실행

```bash
# 얼굴 등록 테스트만 실행
pytest test_main.py::TestFaceRegistration -v

# 얼굴 인식 테스트만 실행
pytest test_main.py::TestFaceRecognition -v

# 특정 테스트 함수만 실행
pytest test_main.py::TestFaceRegistration::test_register_face_success -v
```

### 3.4 테스트 커버리지 확인

```bash
pytest --cov=main --cov-report=html
```

커버리지 리포트는 `python-ai/htmlcov/index.html`에서 확인할 수 있습니다.

### 3.5 테스트 항목

#### TestHealthCheck (헬스 체크)
- ✅ 루트 엔드포인트 응답
- ✅ 헬스 체크 엔드포인트

#### TestFaceRegistration (얼굴 등록)
- ✅ 얼굴 등록 성공
- ✅ 이미지 데이터 없음 검증
- ✅ 사용자 ID 없음 검증
- ✅ 잘못된 Base64 이미지 검증

#### TestFaceRecognition (얼굴 인식)
- ✅ 얼굴 인식 성공
- ✅ 사용자 ID 없이 전체 비교
- ✅ 매칭되지 않는 얼굴 처리

#### TestFaceDataManagement (얼굴 데이터 관리)
- ✅ 존재하지 않는 얼굴 정보 조회
- ✅ 존재하지 않는 얼굴 삭제
- ✅ 등록 → 조회 → 삭제 플로우

#### TestChatAPI (AI 챗봇)
- ✅ 간단한 메시지 전송
- ✅ 대화 히스토리 포함
- ✅ 빈 메시지 검증

#### TestMarketDataAPI (시장 데이터)
- ✅ 시장 데이터 조회

---

## 4. 전체 테스트 실행

### 4.1 자동화 스크립트 (Windows)

`run_all_tests.bat` 파일 생성:

```batch
@echo off
echo ========================================
echo 전체 테스트 실행
echo ========================================

echo.
echo [1/3] Spring Boot 백엔드 테스트...
cd fullStc
call gradlew.bat test
if %errorlevel% neq 0 (
    echo ❌ 백엔드 테스트 실패
    exit /b 1
)
echo ✅ 백엔드 테스트 통과
cd ..

echo.
echo [2/3] React 프론트엔드 테스트...
cd fstac
call npm test -- --run
if %errorlevel% neq 0 (
    echo ❌ 프론트엔드 테스트 실패
    exit /b 1
)
echo ✅ 프론트엔드 테스트 통과
cd ..

echo.
echo [3/3] Python AI 서버 테스트...
cd python-ai
call venv\Scripts\activate && pytest
if %errorlevel% neq 0 (
    echo ❌ Python 테스트 실패
    exit /b 1
)
echo ✅ Python 테스트 통과
cd ..

echo.
echo ========================================
echo ✅ 모든 테스트 통과!
echo ========================================
```

실행:
```bash
run_all_tests.bat
```

### 4.2 자동화 스크립트 (Linux/Mac)

`run_all_tests.sh` 파일 생성:

```bash
#!/bin/bash

echo "========================================"
echo "전체 테스트 실행"
echo "========================================"

# Spring Boot 백엔드 테스트
echo ""
echo "[1/3] Spring Boot 백엔드 테스트..."
cd fullStc
./gradlew test
if [ $? -ne 0 ]; then
    echo "❌ 백엔드 테스트 실패"
    exit 1
fi
echo "✅ 백엔드 테스트 통과"
cd ..

# React 프론트엔드 테스트
echo ""
echo "[2/3] React 프론트엔드 테스트..."
cd fstac
npm test -- --run
if [ $? -ne 0 ]; then
    echo "❌ 프론트엔드 테스트 실패"
    exit 1
fi
echo "✅ 프론트엔드 테스트 통과"
cd ..

# Python AI 서버 테스트
echo ""
echo "[3/3] Python AI 서버 테스트..."
cd python-ai
source venv/bin/activate && pytest
if [ $? -ne 0 ]; then
    echo "❌ Python 테스트 실패"
    exit 1
fi
echo "✅ Python 테스트 통과"
cd ..

echo ""
echo "========================================"
echo "✅ 모든 테스트 통과!"
echo "========================================"
```

실행 권한 부여 및 실행:
```bash
chmod +x run_all_tests.sh
./run_all_tests.sh
```

---

## 5. 테스트 커버리지

### 5.1 목표 커버리지

| 구분 | 목표 | 현재 |
|------|------|------|
| **Spring Boot** | 70% | 측정 필요 |
| **React** | 60% | 측정 필요 |
| **Python AI** | 70% | 측정 필요 |

### 5.2 커버리지 측정

#### Spring Boot
```bash
cd fullStc
./gradlew test jacocoTestReport
# 리포트: build/reports/jacoco/test/html/index.html
```

#### React
```bash
cd fstac
npm test -- --coverage
# 리포트: coverage/index.html
```

#### Python
```bash
cd python-ai
pytest --cov=main --cov-report=html
# 리포트: htmlcov/index.html
```

---

## 6. CI/CD 통합

### 6.1 GitHub Actions 예시

`.github/workflows/test.yml`:

```yaml
name: 테스트 실행

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Run Spring Boot Tests
        run: |
          cd fullStc
          ./gradlew test

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd fstac
          npm ci
      - name: Run React Tests
        run: |
          cd fstac
          npm test -- --run

  python-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd python-ai
          pip install -r requirements.txt
      - name: Run Python Tests
        run: |
          cd python-ai
          pytest -v
```

---

## 7. 문제 해결

### 7.1 Spring Boot 테스트 실패

**문제**: Mock 객체 관련 에러
```
Solution: @MockBean 어노테이션 확인, Mockito 버전 확인
```

**문제**: 데이터베이스 연결 에러
```
Solution: H2 인메모리 DB 사용 또는 Testcontainers 활용
```

### 7.2 React 테스트 실패

**문제**: `Cannot find module` 에러
```bash
Solution: npm install 재실행, node_modules 삭제 후 재설치
```

**문제**: Redux store 관련 에러
```
Solution: renderWithProviders 헬퍼 함수 사용 확인
```

### 7.3 Python 테스트 실패

**문제**: OpenAI API 키 관련 에러
```
Solution: 테스트에서는 Mock 사용, .env 파일 확인
```

**문제**: 파일 시스템 관련 에러
```
Solution: 테스트 후 정리 코드 추가 (teardown)
```

---

## 8. 테스트 모범 사례

### 8.1 AAA 패턴 사용
```
Arrange (준비): 테스트 데이터 및 환경 설정
Act (실행): 테스트 대상 메서드 실행
Assert (검증): 결과 확인
```

### 8.2 테스트 독립성
- 각 테스트는 독립적으로 실행 가능해야 함
- 테스트 간 의존성 제거
- 테스트 후 데이터 정리 (cleanup)

### 8.3 명확한 테스트 이름
```java
// Good
testRegisterFace_Success()
testRegisterFace_NoImage()

// Bad
test1()
test2()
```

---

## 📞 문의

테스트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**마지막 업데이트**: 2026-02-02
