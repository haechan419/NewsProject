"""
뉴스 브리핑 생성 LangChain 체인

뉴스 목록을 받아 DJ 스타일의 브리핑 스크립트를 생성합니다.
같은 뉴스 큐에 대해서는 캐시를 사용하여 API 호출을 최소화합니다.
"""

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from typing import List, Dict
import os
import hashlib
import json
import logging

from .prompts import BRIEFING_PROMPT, DJ_PERSONA

# OpenAI API 키 설정
os.environ.setdefault("OPENAI_API_KEY", os.getenv("OPENAI_API_KEY", ""))

logger = logging.getLogger(__name__)

# 브리핑 캐시 (메모리 기반)
briefing_cache = {}


def create_briefing_chain():
    """브리핑 생성 체인"""
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        max_tokens=1000
    )
    
    prompt = ChatPromptTemplate.from_template(BRIEFING_PROMPT)
    
    chain = prompt | llm
    
    return chain


async def generate_briefing(news_list: List[Dict[str, str]]) -> str:
    """
    플레이리스트용 오프닝·마무리 브리핑 생성 (DJ 스타일).
    기사 본문은 playlist_service에서 별도 삽입하므로, 여기서는 오프닝+마무리만 생성.
    같은 뉴스 큐에 대해서는 캐시 사용.
    
    Args:
        news_list: [ {"news_id", "category", "summary_text" or "summary", "is_hot"}, ... ]
    
    Returns:
        오프닝·마무리 스크립트 (문자열)
    """
    try:
        # 빈 리스트 체크
        if not news_list or len(news_list) == 0:
            return "안녕하세요, 드라이브 모드 뉴스 브리핑을 시작합니다. 오늘은 새로운 뉴스가 없습니다."
        
        # 뉴스 큐 해시 생성 (캐싱용) — summary_text 또는 summary 둘 다 허용
        def _summary(news):
            return news.get("summary_text") or news.get("summary", "")
        news_list_for_hash = [
            {
                "news_id": news.get("news_id", ""),
                "category": news.get("category", ""),
                "summary_text": _summary(news),
                "is_hot": bool(news.get("is_hot", False))
            }
            for news in news_list
        ]
        news_hash = hashlib.md5(
            json.dumps(news_list_for_hash, sort_keys=True).encode('utf-8')
        ).hexdigest()
        
        # 캐시 확인
        if news_hash in briefing_cache:
            logger.info(f"[브리핑 캐시] 캐시 사용: {news_hash[:8]}... ({len(news_list)}개 뉴스)")
            return briefing_cache[news_hash]
        
        # 뉴스 목록을 포맷팅 (LLM에 한글 카테고리로 전달해 스크립트가 한글로 나오도록)
        formatted_news = []
        for i, news in enumerate(news_list, 1):
            category = news.get("category", "일반")
            category_kr = _category_to_korean(category)
            summary = news.get("summary_text") or news.get("summary", "")
            # is_hot이 boolean 또는 문자열일 수 있음
            is_hot = news.get("is_hot", False)
            if isinstance(is_hot, str):
                is_hot = is_hot.lower() in ["true", "1", "yes"]
            
            prefix = "🔥 긴급 속보: " if is_hot else f"{i}. "
            formatted_news.append(f"{prefix}[{category_kr}] {summary}")
        
        news_list_text = "\n\n".join(formatted_news)
        
        # 새로 생성
        logger.info(f"[브리핑 생성] 새로 생성: {news_hash[:8]}... ({len(news_list)}개 뉴스)")
        chain = create_briefing_chain()
        result = await chain.ainvoke({"news_list": news_list_text})
        briefing_text = result.content
        
        # 캐시 저장
        briefing_cache[news_hash] = briefing_text
        logger.info(f"[브리핑 캐시] 캐시 저장 완료: {news_hash[:8]}...")
        
        return briefing_text
    except Exception as e:
        logger.error(f"[브리핑 생성] 오류 발생: {e}", exc_info=True)
        # 실패 시 기본 포맷으로 반환
        return _create_default_briefing(news_list)


def _category_to_korean(category: str) -> str:
    """카테고리 영문 → 한글 (기본 브리핑 출력용)"""
    m = {
        "economy": "경제", "politics": "정치", "society": "사회",
        "it": "IT", "world": "글로벌", "sports": "스포츠",
        "entertainment": "연예", "science": "과학",
    }
    return m.get((category or "").lower(), "일반")


def _create_default_briefing(news_list: List[Dict[str, str]]) -> str:
    """기본 브리핑 생성 (LLM 실패 시). summary_text/summary 둘 다 허용, 카테고리 한글 출력."""
    briefing = "안녕하세요, 드라이브 모드 뉴스 브리핑을 시작합니다.\n\n"
    
    for i, news in enumerate(news_list, 1):
        category = news.get("category", "일반")
        summary = news.get("summary_text") or news.get("summary", "")
        is_hot = news.get("is_hot", False)
        category_kr = _category_to_korean(category)
        
        if is_hot:
            briefing += f"🔥 긴급 속보입니다. {category_kr} 관련 소식입니다. {summary}\n\n"
        else:
            briefing += f"다음은 {category_kr} 소식입니다. {summary}\n\n"
    
    return briefing
