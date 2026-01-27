# main.py - AI 챗봇 FastAPI 서버
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from config import CORS_ORIGINS

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="AI Chat API",
    description="GPT-4o-mini 기반 AI 챗봇 API",
    version="1.0.0"
)

# CORS 설정 (Spring Boot에서 호출 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
from routers import chat, face, news

app.include_router(chat.router)
app.include_router(face.router)
app.include_router(news.router)


# ===== API 엔드포인트 =====
@app.get("/")
async def root():
    """헬스 체크"""
    return {"status": "ok", "message": "AI Chat API is running"}


@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }


# ===== 서버 실행 =====
if __name__ == "__main__":
    import uvicorn
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000, 
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        logger.info("서버가 종료되었습니다.")
    except Exception as e:
        logger.error(f"서버 실행 중 오류 발생: {str(e)}")
        raise
