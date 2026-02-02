# 테스트 실행 순서 가이드

## 권장 실행 순서

### 1. 기본 원칙
- **테스트는 독립적이어야 함**: 각 테스트는 다른 테스트에 의존하지 않아야 합니다.
- **@Transactional 사용**: 각 테스트는 자동으로 롤백되므로 순서에 크게 의존하지 않습니다.
- **더미 데이터 테스트는 마지막에**: 대량의 데이터를 생성하는 테스트는 마지막에 실행하는 것이 좋습니다.

### 2. 권장 실행 순서

```
1. MemberRepositoryTest (기본 CRUD 테스트)
   ↓
2. RefreshTokenRepositoryTest (RefreshToken 관련 테스트)
   ↓
3. MemberCategoryRepositoryTest (카테고리 관련 테스트)
   ↓
4. DataInitializerTest (더미 데이터 생성 - 선택적)
```

## 실행 방법

### 방법 1: Gradle로 전체 테스트 실행 (권장)
```bash
# 모든 테스트 실행 (자동으로 순서 최적화)
gradlew test

# 특정 패키지의 테스트만 실행
gradlew test --tests "com.fullStc.member.repository.*"
```

### 방법 2: 특정 테스트 클래스만 실행
```bash
# MemberRepository 테스트만 실행
gradlew test --tests "MemberRepositoryTest"

# 여러 테스트 클래스 실행
gradlew test --tests "MemberRepositoryTest" --tests "RefreshTokenRepositoryTest"
```

### 방법 3: IDE에서 실행
- IntelliJ IDEA: 각 테스트 클래스 우클릭 → Run
- VS Code: 테스트 메서드 위의 "Run Test" 클릭

### 방법 4: 순서를 명시적으로 지정 (필요시)
테스트 클래스에 @Order 어노테이션 추가 가능

## 주의사항

1. **@Transactional 사용**: 모든 테스트가 @Transactional로 격리되어 있으므로 순서에 크게 의존하지 않습니다.
2. **더미 데이터 테스트**: DataInitializerTest는 선택적으로 실행 (개발 초기 단계에서만 필요)
3. **병렬 실행**: JUnit은 기본적으로 병렬 실행을 지원하지만, 실제 DB를 사용할 때는 순차 실행을 권장합니다.

## 테스트 실행 설정 (build.gradle)

```gradle
tasks.named('test') {
    useJUnitPlatform()
    // 순차 실행 (실제 DB 사용 시 권장)
    maxParallelForks = 1
}
```
