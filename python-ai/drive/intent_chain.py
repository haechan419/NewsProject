"""
음성 명령 의도 분석 LangChain 체인

STT로 변환된 사용자 명령 텍스트를 분석하여 의도를 파악합니다.
같은 텍스트에 대해서는 캐시를 사용하여 API 호출을 최소화합니다.
"""

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import Optional
import json
import os
import hashlib
import logging

from .prompts import INTENT_ANALYSIS_PROMPT

# OpenAI API 키 설정
os.environ.setdefault("OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", ""))

logger = logging.getLogger(__name__)

# 의도 분석 캐시 (메모리 기반)
intent_cache = {}


class IntentAnalysis(BaseModel):
    intent: str = Field(description="명령 의도")
    confidence: float = Field(description="신뢰도 점수 (0.0~1.0)")
    reasoning: str = Field(description="분석 근거")


def create_intent_chain():
    """명령어 의도 분석 체인 생성"""
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.3,
        max_tokens=200
    )
    
    prompt = ChatPromptTemplate.from_template(INTENT_ANALYSIS_PROMPT)
    
    parser = PydanticOutputParser(pydantic_object=IntentAnalysis)
    
    chain = prompt | llm | parser
    
    return chain


async def analyze_intent(command_text: str) -> dict:
    """
    음성 명령 의도 분석
    
    같은 텍스트에 대해서는 캐시를 사용하여 API 호출을 최소화합니다.
    
    Args:
        command_text: STT로 변환된 사용자 명령 텍스트
    
    Returns:
        {
            "intent": str,
            "confidence": float,
            "message": str
        }
    """
    try:
        # 텍스트 해시 생성 (캐싱용)
        # 텍스트를 정규화하여 대소문자/공백 차이 무시
        normalized_text = command_text.strip().lower()
        text_hash = hashlib.md5(normalized_text.encode('utf-8')).hexdigest()
        
        # 캐시 확인
        if text_hash in intent_cache:
            logger.info(f"[의도 분석 캐시] 캐시 사용: {text_hash[:8]}... (텍스트: {normalized_text[:20]}...)")
            return intent_cache[text_hash]
        
        # 새로 분석
        logger.info(f"[의도 분석] 새로 분석: {text_hash[:8]}... (텍스트: {normalized_text[:20]}...)")
        chain = create_intent_chain()
        result = await chain.ainvoke({"command_text": command_text})
        
        intent_result = {
            "intent": result.intent,
            "confidence": result.confidence,
            "message": f"명령어 분석 완료: {result.intent} (신뢰도: {result.confidence:.2f})"
        }
        
        # 캐시 저장
        intent_cache[text_hash] = intent_result
        logger.info(f"[의도 분석 캐시] 캐시 저장 완료: {text_hash[:8]}...")
        
        return intent_result
    except Exception as e:
        logger.error(f"[의도 분석] 오류 발생: {e}", exc_info=True)
        # 분석 실패 시 기본 응답
        return {
            "intent": None,
            "confidence": 0.0,
            "message": f"명령어 분석 실패: {str(e)}"
        }
