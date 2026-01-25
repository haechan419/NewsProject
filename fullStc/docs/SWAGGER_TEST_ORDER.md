# Swagger API 테스트 순서 가이드

## 📋 목차
1. [Swagger 접속 방법](#swagger-접속-방법)
2. [테스트 순서](#테스트-순서)
3. [각 API 상세 가이드](#각-api-상세-가이드)
4. [주의사항](#주의사항)

---

## Swagger 접속 방법

1. **애플리케이션 실행**
   ```bash
   ./gradlew bootRun
   # 또는 IDE에서 실행
   ```

2. **Swagger UI 접속**
   - 브라우저에서 `http://localhost:8080/swagger-ui/index.html` 접속

---

## 테스트 순서

### 🔄 기본 플로우

```
1. 회원가입 (/api/auth/signup)
   ↓
2. 로그인 (/api/auth/login-json) → Access Token 발급
   ↓
3. JWT 토큰 등록 (Swagger UI 우측 상단 "Authorize" 버튼)
   ↓
4. 내 정보 조회 (/api/user/me) - 인증 필요
   ↓
5. 관심 카테고리 업데이트 (/api/user/categories) - 인증 필요
   ↓
6. 토큰 갱신 (/api/auth/refresh) - 선택적
   ↓
7. 로그아웃 (/api/auth/logout) - 인증 필요
```

---

## 각 API 상세 가이드

### 1️⃣ 회원가입 (`POST /api/auth/signup`)

**인증 필요:** ❌ 없음

**요청 Body 예시:**
```json
{
  "email": "test@example.com",
  "password": "Test1234!@",
  "nickname": "테스트유저"
}
```

**요청 규칙:**
- `email`: 이메일 형식 (예: `test@example.com`)
- `password`: 최소 8자, 영문/숫자/특수문자 포함 (예: `Test1234!@`)
- `nickname`: 2자 이상 20자 이하

**예상 응답:**
- `201 Created`: 회원가입 성공
  ```json
  1  // 생성된 사용자 ID
  ```
- `400 Bad Request`: 이메일/닉네임 중복 또는 유효성 검증 실패

**테스트 방법:**
1. Swagger UI에서 "인증" 섹션 찾기
2. `POST /api/auth/signup` 클릭
3. "Try it out" 버튼 클릭
4. 위의 JSON 예시 입력
5. "Execute" 버튼 클릭

---

### 2️⃣ 로그인 (`POST /api/auth/login-json`)

**인증 필요:** ❌ 없음

**요청 Body 예시:**
```json
{
  "email": "test@example.com",
  "password": "Test1234!@"
}
```

**예상 응답:**
- `200 OK`: 로그인 성공
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
  ```
- `400 Bad Request`: 이메일/비밀번호 불일치 또는 계정 비활성화

**⚠️ 중요:**
- 응답으로 받은 `accessToken`을 복사해두세요! (다음 단계에서 사용)

**테스트 방법:**
1. `POST /api/auth/login-json` 클릭
2. "Try it out" 버튼 클릭
3. 위의 JSON 예시 입력 (회원가입 시 사용한 이메일/비밀번호)
4. "Execute" 버튼 클릭
5. 응답에서 `accessToken` 값 복사

---

### 3️⃣ JWT 토큰 등록 (Swagger Authorize)

**인증 필요:** ❌ 없음 (설정 단계)

**목적:** 이후 API 호출 시 자동으로 JWT 토큰을 헤더에 포함시킵니다.

**설정 방법:**
1. Swagger UI **우측 상단**의 **"Authorize" 🔒** 버튼 클릭
2. "JWT" 섹션의 "Value" 입력란에 다음 형식으로 입력:
   ```
   Bearer {accessToken}
   ```
   예시:
   ```
   Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ **주의:** `Bearer ` 뒤에 공백 한 칸을 반드시 포함하세요!
3. "Authorize" 버튼 클릭
4. "Close" 버튼으로 창 닫기

**확인 방법:**
- 이후 API 호출 시 자동으로 `Authorization: Bearer {token}` 헤더가 포함됩니다.

---

### 4️⃣ 내 정보 조회 (`GET /api/user/me`)

**인증 필요:** ✅ JWT 토큰 필요

**요청 Body:** 없음

**예상 응답:**
- `200 OK`: 조회 성공
  ```json
  {
    "id": 1,
    "email": "test@example.com",
    "nickname": "테스트유저",
    "provider": "LOCAL",
    "enabled": true,
    "roleNames": ["USER"],
    "categories": []
  }
  ```
- `401 Unauthorized`: JWT 토큰이 없거나 유효하지 않음

**테스트 방법:**
1. **먼저 3단계(JWT 토큰 등록)를 완료했는지 확인**
2. `GET /api/user/me` 클릭
3. "Try it out" 버튼 클릭
4. "Execute" 버튼 클릭

---

### 5️⃣ 관심 카테고리 업데이트 (`PUT /api/user/categories`)

**인증 필요:** ✅ JWT 토큰 필요

**요청 Body 예시:**
```json
{
  "categories": ["엔터테이먼트", "경제", "스포츠"]
}
```

**카테고리 목록:**
- `엔터테이먼트`
- `경제`
- `스포츠`
- `IT/기술`
- `사회/이슈`

**요청 규칙:**
- `categories`: 최소 1개 이상의 카테고리 필수
- 배열 형식으로 전달

**예상 응답:**
- `200 OK`: 업데이트 성공 (응답 Body 없음)
- `400 Bad Request`: 카테고리 목록이 비어있음
- `401 Unauthorized`: JWT 토큰이 없거나 유효하지 않음

**테스트 방법:**
1. **먼저 3단계(JWT 토큰 등록)를 완료했는지 확인**
2. `PUT /api/user/categories` 클릭
3. "Try it out" 버튼 클릭
4. 위의 JSON 예시 입력
5. "Execute" 버튼 클릭

---

### 6️⃣ 토큰 갱신 (`POST /api/auth/refresh`)

**인증 필요:** ❌ 없음 (Refresh Token만 필요)

**목적:** Access Token이 만료되었을 때 Refresh Token으로 새로운 Access Token 발급

**요청 Body 예시:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**예상 응답:**
- `200 OK`: 토큰 갱신 성공
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer"
  }
  ```
- `400 Bad Request`: 유효하지 않거나 만료된 Refresh Token

**테스트 방법:**
1. `POST /api/auth/refresh` 클릭
2. "Try it out" 버튼 클릭
3. 2단계(로그인)에서 받은 `refreshToken` 입력
4. "Execute" 버튼 클릭
5. 새로운 `accessToken`을 받아서 3단계(Authorize)에서 다시 등록

---

### 7️⃣ 로그아웃 (`POST /api/auth/logout`)

**인증 필요:** ✅ JWT 토큰 필요

**요청 Body:** 없음

**예상 응답:**
- `200 OK`: 로그아웃 성공 (응답 Body 없음)
- `401 Unauthorized`: JWT 토큰이 없거나 유효하지 않음

**테스트 방법:**
1. **먼저 3단계(JWT 토큰 등록)를 완료했는지 확인**
2. `POST /api/auth/logout` 클릭
3. "Try it out" 버튼 클릭
4. "Execute" 버튼 클릭

**참고:**
- 로그아웃 후에는 해당 사용자의 모든 Refresh Token이 삭제됩니다.
- 이후 토큰 갱신(6단계)은 불가능합니다.

---

## 주의사항

### 🔐 인증이 필요한 API
다음 API는 JWT 토큰이 필요합니다:
- `GET /api/user/me`
- `PUT /api/user/categories`
- `POST /api/auth/logout`

**해결 방법:**
- 3단계(Authorize)에서 JWT 토큰을 등록하면 자동으로 헤더에 포함됩니다.

### ⚠️ 토큰 만료
- Access Token: 60분 후 만료
- Refresh Token: 24시간 후 만료

**토큰 만료 시:**
1. 6단계(토큰 갱신)를 사용하여 새로운 Access Token 발급
2. 새로운 Access Token을 3단계(Authorize)에서 다시 등록

### 🔄 테스트 순서 재시작
새로운 사용자로 테스트하려면:
1. 새로운 이메일로 회원가입 (1단계)
2. 로그인하여 토큰 발급 (2단계)
3. 새로운 토큰을 Authorize에 등록 (3단계)
4. 이후 단계 진행

### 📝 요청 데이터 형식
- 모든 요청은 **JSON 형식**입니다.
- Content-Type은 자동으로 `application/json`으로 설정됩니다.

### ✅ 성공 응답 코드
- `200 OK`: 성공
- `201 Created`: 생성 성공 (회원가입)

### ❌ 에러 응답 코드
- `400 Bad Request`: 잘못된 요청 (유효성 검증 실패, 중복 등)
- `401 Unauthorized`: 인증 실패 (토큰 없음, 만료 등)
- `500 Internal Server Error`: 서버 오류

---

## 💡 팁

1. **토큰 복사하기:**
   - 로그인 응답에서 `accessToken`을 클릭하면 전체 토큰이 선택됩니다.
   - Ctrl+C (또는 Cmd+C)로 복사하세요.

2. **Authorize 창 다시 열기:**
   - 우측 상단의 "Authorize" 버튼을 다시 클릭하면 등록된 토큰을 확인/수정할 수 있습니다.

3. **에러 발생 시:**
   - 응답의 "Response body"를 확인하여 에러 메시지를 확인하세요.
   - `401 Unauthorized`가 나오면 토큰이 만료되었거나 등록되지 않았을 수 있습니다.

4. **여러 사용자 테스트:**
   - 각 사용자마다 다른 이메일을 사용하세요.
   - 이메일과 닉네임은 중복될 수 없습니다.
