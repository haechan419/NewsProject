from pydantic import BaseModel
from typing import List, Optional


class NewsItem(BaseModel):
    """뉴스 아이템"""
    id: Optional[str] = None
    title: str
    ai_summary: Optional[str] = None
    aiSummary: Optional[str] = None  # camelCase 지원
    content: str
    cross_source_count: Optional[int] = 1


class QualityCheckResponse(BaseModel):
    """품질 검증 응답"""
    news_id: Optional[str] = None
    quality_score: int
    risk_flags: List[str]
    badge: str
    evidence_summary: str
