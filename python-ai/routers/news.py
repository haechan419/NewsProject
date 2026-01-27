from fastapi import APIRouter, HTTPException
from typing import List
import logging
from models import NewsItem, QualityCheckResponse
from quality_check import run_one

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/news", tags=["news"])


@router.post("/quality-check", response_model=List[QualityCheckResponse])
async def check_news_quality(news_items: List[NewsItem]):
    """
    뉴스 품질 검증 API
    여러 뉴스 아이템의 품질을 검증하고 점수를 반환합니다.
    """
    try:
        results = []
        for item in news_items:
            # NewsItem을 Dict로 변환
            item_dict = {
                "id": item.id,
                "title": item.title,
                "ai_summary": item.ai_summary or item.aiSummary or "",
                "content": item.content,
                "cross_source_count": item.cross_source_count or 1
            }
            # quality_check의 run_one 함수 사용
            result = run_one(item_dict)
            results.append(QualityCheckResponse(**result))
        
        logger.info(f"뉴스 품질 검증 완료: {len(results)}개 아이템 처리")
        return results
    
    except Exception as e:
        logger.error(f"뉴스 품질 검증 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"뉴스 품질 검증 중 오류가 발생했습니다: {str(e)}"
        )
