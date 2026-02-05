"""
브리핑 배송 FastAPI 라우터: NLU(의도·배송시간), PDF 생성
"""

import logging
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from .nlu_chain import analyze_brief_delivery
from .pdf_service import build_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/brief-delivery", tags=["brief-delivery"])


class AnalyzeRequest(BaseModel):
    raw_text: str
    user_id: int


class AnalyzeResponse(BaseModel):
    intent: Optional[str]
    scheduled_at: Optional[str]
    message: str


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    텍스트에서 브리핑 배송 의도와 예약 시각 추출
    """
    try:
        result = await analyze_brief_delivery(request.raw_text, request.user_id)
        return AnalyzeResponse(
            intent=result.get("intent"),
            scheduled_at=result.get("scheduled_at"),
            message=result.get("message", "분석 완료"),
        )
    except Exception as e:
        logger.exception("브리핑 배송 NLU 오류: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-pdf")
async def generate_pdf(payload: dict[str, Any]):
    """
    Java에서 전달한 뉴스 데이터로 PDF 생성 후 바이트 반환
    """
    try:
        pdf_bytes = build_pdf(payload)
        if not pdf_bytes:
            raise HTTPException(status_code=500, detail="PDF 생성 실패")
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=briefing.pdf"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("브리핑 PDF 생성 오류: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
