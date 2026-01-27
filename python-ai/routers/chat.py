from fastapi import APIRouter, HTTPException
from openai import OpenAI
import logging
from models import ChatRequest, ChatResponse
from prompts import SYSTEM_PROMPT
from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=OPENAI_API_KEY)


@router.post("", response_model=ChatResponse)
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
