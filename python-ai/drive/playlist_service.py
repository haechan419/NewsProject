"""
플레이리스트 전체 TTS 생성 서비스 (플레이리스트 방식)

- 전체를 하나의 연속 스크립트로 만들어 단일 TTS 파일 생성 (historyId 기준 캐싱).
- 문장 단위 인덱스 없음. 재생 위치는 초 단위(playback_position)로만 사용.
- 구성: 오프닝·마무리(브리핑) + 기사별 "다음은 OO 기사입니다. 제목. 요약".
"""

from typing import List, Dict, Optional
import logging
import re

from .briefing_chain import generate_briefing
from .tts_service import generate_playlist_speech
from .logger_config import get_logger

logger = get_logger(__name__)


def summary_for_tts(summary: str) -> str:
    """TTS용: [서론][본론][결론] 제거 후 한 문장 서술형으로. DB는 수정하지 않음."""
    if not summary or not summary.strip():
        return ""
    s = summary.strip()
    for marker in ["[서론]", "[본론]", "[결론]"]:
        s = s.replace(marker, " ")
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _summary_to_polite(summary: str) -> str:
    """TTS용: 평서형(~하다/~이다 등) → 존댓말(~합니다/~입니다) 통일."""
    if not summary or not summary.strip():
        return ""
    s = summary.strip()
    # 뉴스 요약에 자주 나오는 동사·형용사 종결형 추가 (순서: 구체적 패턴 먼저)
    replacements = [
        # 자주 쓰이는 뉴스 용어 (먼저 처리)
        (r"나타났다\.", "나타났습니다."),
        (r"나타났다\s", "나타났습니다. "),
        (r"나타났다$", "나타났습니다"),
        (r"밝혔다\.", "밝혔습니다."),
        (r"밝혔다\s", "밝혔습니다. "),
        (r"밝혔다$", "밝혔습니다"),
        (r"말했다\.", "말했습니다."),
        (r"말했다\s", "말했습니다. "),
        (r"말했다$", "말했습니다"),
        (r"전했다\.", "전했습니다."),
        (r"전했다\s", "전했습니다. "),
        (r"전했다$", "전했습니다"),
        (r"수 있다\.", "수 있습니다."),
        (r"수 있다\s", "수 있습니다. "),
        (r"수 있다$", "수 있습니다"),
        (r"고 있다\.", "고 있습니다."),
        (r"고 있다\s", "고 있습니다. "),
        (r"고 있다$", "고 있습니다"),
        (r"있다\.", "있습니다."),
        (r"있다\s", "있습니다. "),
        (r"있다$", "있습니다"),
        (r"없다\.", "없습니다."),
        (r"없다\s", "없습니다. "),
        (r"없다$", "없습니다"),
        # 기본 평서형
        (r"하다\.", "합니다."),
        (r"했다\.", "했습니다."),
        (r"이다\.", "입니다."),
        (r"었다\.", "었습니다."),
        (r"였다\.", "였습니다."),
        (r"한다\.", "합니다."),
        (r"된다\.", "됩니다."),
        (r"않다\.", "않습니다."),
        (r"한다\s", "합니다. "),
        (r"했다\s", "했습니다. "),
        (r"이다\s", "입니다. "),
        (r"었다\s", "었습니다. "),
        (r"였다\s", "였습니다. "),
        (r"하다\s", "합니다. "),
        (r"된다\s", "됩니다. "),
        (r"않다\s", "않습니다. "),
        (r"한다$", "합니다"),
        (r"했다$", "했습니다"),
        (r"이다$", "입니다"),
        (r"었다$", "었습니다"),
        (r"였다$", "였습니다"),
        (r"하다$", "합니다"),
        (r"된다$", "됩니다"),
        (r"않다$", "않습니다"),
    ]
    for pat, repl in replacements:
        s = re.sub(pat, repl, s)
    return s


async def generate_playlist_full_text(news_list: List[Dict[str, str]]) -> str:
    """
    플레이리스트 전체 텍스트 생성 (오프닝·마무리 + 기사별 블록).
    플레이리스트 방식: 문장 인덱스 없이 한 덩어리 스크립트 → 단일 TTS.
    
    Args:
        news_list: [ {"news_id", "title", "category", "summary"}, ... ]
    
    Returns:
        전체 텍스트 (브리핑 + "다음은 X 기사입니다. 제목. 요약" × N)
    """
    try:
        # 브리핑 체인은 "summary_text" 키를 사용하므로, Java에서 오는 "summary"를 매핑
        news_list_for_briefing = [
            {
                **item,
                "summary_text": item.get("summary") or item.get("summary_text", ""),
            }
            for item in news_list
        ]
        # 1단계: 브리핑 스크립트 생성 (오프닝 + 마무리 두 문단)
        briefing_script = await generate_briefing(news_list_for_briefing)
        
        parts = [p.strip() for p in briefing_script.strip().split("\n\n") if p.strip()]
        if len(parts) >= 2:
            opening = _summary_to_polite(parts[0])
            closing = _summary_to_polite("\n\n".join(parts[1:]))
        else:
            opening = _summary_to_polite(briefing_script.strip())
            closing = ""

        # 2단계: 각 뉴스 텍스트 추가
        news_texts = []
        for news in news_list:
            category = news.get("category", "일반")
            title = news.get("title", "")
            summary_raw = summary_for_tts(news.get("summary", ""))
            summary = _summary_to_polite(summary_raw)  # TTS 시 존댓말로 변환
            if not summary:
                summary = summary_raw  # 변환 실패 시 원문 유지
            
            # 카테고리명을 한국어로 변환
            category_kr = _convert_category_to_korean(category)
            
            # 각 뉴스 앞에 카테고리 멘트 추가 (summary는 TTS용 서술형 + 존댓말)
            news_text = f"다음은 {category_kr} 기사입니다. {title}. {summary}"
            news_texts.append(news_text)
        
        # 3단계: 전체 텍스트 합치기 — 오프닝 + 기사들 + 마무리 (마무리가 맨 마지막에 나오도록)
        full_text = opening + "\n\n" + "\n\n".join(news_texts)
        if closing:
            full_text += "\n\n" + closing
        
        logger.info(f"플레이리스트 전체 텍스트 생성 완료: {len(news_list)}개 뉴스, 총 {len(full_text)}자")
        return full_text
        
    except Exception as e:
        logger.error(f"플레이리스트 전체 텍스트 생성 실패: {e}", exc_info=True)
        # 실패 시 기본 포맷으로 반환
        return _create_default_playlist_text(news_list)


def _convert_category_to_korean(category: str) -> str:
    """카테고리명을 한국어로 변환"""
    category_map = {
        "economy": "경제",
        "politics": "정치",
        "society": "사회",
        "it": "IT",
        "world": "글로벌",
        "sports": "스포츠",
        "entertainment": "연예",
        "science": "과학",
    }
    return category_map.get(category.lower(), "일반")


def _create_default_playlist_text(news_list: List[Dict[str, str]]) -> str:
    """기본 플레이리스트 텍스트 생성 (실패 시) — 요약은 존댓말 변환"""
    text = "안녕하세요, 드라이브 모드 뉴스 브리핑을 시작합니다.\n\n"
    
    for news in news_list:
        category = news.get("category", "일반")
        title = news.get("title", "")
        summary_raw = summary_for_tts(news.get("summary", ""))
        summary = _summary_to_polite(summary_raw) or summary_raw
        category_kr = _convert_category_to_korean(category)
        
        text += f"다음은 {category_kr} 기사입니다. {title}. {summary}\n\n"
    
    return text
