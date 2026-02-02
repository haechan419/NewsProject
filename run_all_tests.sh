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
