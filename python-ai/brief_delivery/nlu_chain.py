"""
브리핑 배송 NLU: 의도 + 배송 시각 추출
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate

from .prompts import BRIEF_DELIVERY_NLU_PROMPT

logger = logging.getLogger(__name__)


def _get_current_date() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _extract_json(content: str) -> dict | None:
    """응답 텍스트에서 JSON 객체 추출 (마크다운 코드블록 또는 {...} 블록)"""
    if not content or not content.strip():
        return None
    content = content.strip()
    # ```json ... ``` 또는 ``` ... ``` 제거
    if content.startswith("```"):
        parts = content.split("```")
        if len(parts) >= 2:
            content = parts[1]
            if content.lower().startswith("json"):
                content = content[4:].strip()
    # 첫 번째 { 부터 중괄호 균형 맞춰 추출
    start = content.find("{")
    if start == -1:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return None
    depth = 0
    for i in range(start, len(content)):
        if content[i] == "{":
            depth += 1
        elif content[i] == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(content[start : i + 1])
                except json.JSONDecodeError:
                    break
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return None


async def analyze_brief_delivery(raw_text: str, user_id: int) -> dict[str, Any]:
    """
    발화에서 브리핑 배송 의도와 예약 시각 추출

    Returns:
        {
            "intent": "BRIEF_DELIVERY_SUBSCRIBE" | "OTHER",
            "scheduled_at": "ISO8601" | None,
            "message": str
        }
    """
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY가 설정되지 않았습니다.")
        return {
            "intent": "OTHER",
            "scheduled_at": None,
            "message": "의도 분석에 실패했습니다. (OpenAI API 키를 확인해 주세요.)",
        }
    try:
        current_date = _get_current_date()
        prompt = ChatPromptTemplate.from_template(BRIEF_DELIVERY_NLU_PROMPT)
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2, max_tokens=300)
        chain = prompt | llm
        result = await chain.ainvoke({
            "raw_text": raw_text or "",
            "current_date": current_date,
        })
        content = result.content if hasattr(result, "content") else str(result)
        data = _extract_json(content)
        if not data:
            logger.warning("NLU JSON 추출 실패. raw 응답 일부: %s", (content or "")[:300])
            return {
                "intent": "OTHER",
                "scheduled_at": None,
                "message": "의도 분석에 실패했습니다.",
            }
        intent = data.get("intent") or "OTHER"
        scheduled_at = data.get("scheduled_at")
        if scheduled_at is not None and isinstance(scheduled_at, str) and scheduled_at.strip().lower() == "null":
            scheduled_at = None
        message = data.get("message") or "분석 완료"
        # 브리핑 예약 전용이므로, OTHER일 때 "뉴스 재생 제어" 등 드라이브 관련 문구는 사용하지 않음
        if intent == "OTHER" and message and ("재생 제어" in message or "요청이 없습니다" in message):
            message = "예약하실 시간을 말씀해 주세요. 예: 내일 아침 9시에 보내줘"
        return {
            "intent": intent,
            "scheduled_at": scheduled_at,
            "message": message,
        }
    except Exception as e:
        logger.exception("브리핑 배송 NLU 오류: %s", e)
        return {
            "intent": "OTHER",
            "scheduled_at": None,
            "message": "의도 분석에 실패했습니다.",
        }
