import os
from pathlib import Path
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# OpenAI API 키
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# 얼굴 데이터 저장 디렉토리
FACE_DATA_DIR = Path("face_data")
FACE_DATA_DIR.mkdir(exist_ok=True)

# CORS 설정
CORS_ORIGINS = [
    "http://localhost:8080",  # Spring Boot
    "http://localhost:3000",  # React (CRA)
    "http://localhost:5173",  # React (Vite)
]
