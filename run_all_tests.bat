@echo off
chcp 65001 > nul
echo ========================================
echo 전체 테스트 실행
echo ========================================

echo.
echo [1/3] Spring Boot 백엔드 테스트...
cd fullStc
call gradlew.bat test
if %errorlevel% neq 0 (
    echo ❌ 백엔드 테스트 실패
    cd ..
    pause
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
    cd ..
    pause
    exit /b 1
)
echo ✅ 프론트엔드 테스트 통과
cd ..

echo.
echo [3/3] Python AI 서버 테스트...
cd python-ai
call venv\Scripts\activate.bat && pytest
if %errorlevel% neq 0 (
    echo ❌ Python 테스트 실패
    cd ..
    pause
    exit /b 1
)
echo ✅ Python 테스트 통과
cd ..

echo.
echo ========================================
echo ✅ 모든 테스트 통과!
echo ========================================
pause
