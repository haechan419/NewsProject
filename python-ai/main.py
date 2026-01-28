# main.py - AI 챗봇 FastAPI 서버
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
import os
from dotenv import load_dotenv
import logging

# 환경 변수 로드
load_dotenv()

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
    allow_origins=[
        "http://localhost:8080",  # Spring Boot
        "http://localhost:3000",  # React (CRA)
        "http://localhost:5173",  # React (Vite)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ===== Pydantic 모델 =====
class ConversationMessage(BaseModel):
    """대화 메시지"""
    role: str  # "user" 또는 "assistant"
    content: str


class ChatRequest(BaseModel):
    """채팅 요청"""
    message: str
    conversation_history: Optional[List[ConversationMessage]] = None


class ChatResponse(BaseModel):
    """채팅 응답"""
    reply: str


# ===== 시스템 프롬프트 =====
SYSTEM_PROMPT = """당신은 친절하고 도움이 되는 AI 어시스턴트입니다.
사용자의 질문에 명확하고 간결하게 답변해주세요.
한국어로 대화합니다.
전문적이면서도 친근한 톤을 유지합니다."""


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


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 채팅 엔드포인트
    
    - message: 사용자 메시지
    - conversation_history: 이전 대화 기록 (선택)
    """
    logger.info(f"채팅 요청 수신: {request.message[:50]}...")
    
    try:
        # 메시지 목록 구성
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # 이전 대화 기록 추가
        if request.conversation_history:
            for msg in request.conversation_history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # 현재 사용자 메시지 추가
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        # OpenAI API 호출
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )
        
        # 응답 추출
        reply = response.choices[0].message.content
        
        logger.info(f"AI 응답 생성 완료: {reply[:50]}...")
        
        return ChatResponse(reply=reply)
        
    except Exception as e:
        logger.error(f"채팅 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI 응답 생성 중 오류가 발생했습니다: {str(e)}"
        )


# ===== 서버 실행 =====
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
