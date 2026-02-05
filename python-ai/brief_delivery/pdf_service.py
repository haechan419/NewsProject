"""
브리핑 PDF 생성: 신문형 레이아웃 (제호, 1면 리드, 2단 그리드, 푸터)
"""

import io
import logging
from typing import Any, Optional

import qrcode
import requests
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

# 카테고리 영어 → 한글 표기 (news_cluster.category 기준)
CATEGORY_DISPLAY = {
    "politics": "정치",
    "economy": "경제",
    "it": "IT/과학",
    "world": "국제",
    "society": "사회",
    "culture": "문화",
}

# 한글 폰트 없으면 기본 폰트 사용 (Helvetica)
try:
    pdfmetrics.registerFont(TTFont("Malgun", "C:/Windows/Fonts/malgun.ttf"))
    DEFAULT_FONT = "Malgun"
except Exception:
    DEFAULT_FONT = "Helvetica"


def _category_label(cat: str) -> str:
    if not cat or not cat.strip():
        return "기타"
    return CATEGORY_DISPLAY.get(cat.strip().lower(), cat.strip())


def _make_qr_image(url: str, size_mm: float = 25) -> Optional[bytes]:
    if not url or not url.strip():
        return None
    try:
        qr = qrcode.QRCode(version=1, box_size=4, border=2)
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf.read()
    except Exception as e:
        logger.warning("QR 생성 실패: %s", e)
        return None


def _fetch_image_bytes(url: str) -> Optional[bytes]:
    if not url or not url.strip():
        return None
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            return r.content
    except Exception as e:
        logger.warning("이미지 다운로드 실패: %s", e)
    return None


def _summary_for_pdf(full_summary: str, max_chars: int) -> str:
    """
    PDF용 요약: DB 저장 형식 [서론]/[본론]/[결론] 중 **[본론]**(상세 내용) 구간 사용.
    본론이 없으면 서론(핵심) 또는 첫 문단 사용. 넘치면 문장 경계에서 자름.
    """
    if not full_summary or not full_summary.strip():
        return ""
    text = full_summary.strip()
    # 1) DB 형식: [본론] ~ [결론] 직전까지 추출 (상세 내용)
    for start_marker in ("[본론]", "[본론]\n", "[본론] "):
        idx = text.find(start_marker)
        if idx >= 0:
            start = idx + len(start_marker)
            segment = text[start:].strip()
            for end_marker in ("[결론]", "[결론]\n", "[결론] "):
                end_idx = segment.find(end_marker)
                if end_idx >= 0:
                    segment = segment[:end_idx].strip()
                    break
            if segment:
                text = segment
                break
    # 2) 프론트 표기(💡/📖/🏁) 형식: 상세 내용 = 📖 ~ 🏁 직전
    if text == full_summary.strip():
        for start_marker in ("📖 상세 내용", "📖상세 내용", "📖"):
            idx = text.find(start_marker)
            if idx >= 0:
                start = idx + len(start_marker)
                segment = text[start:].strip()
                for end_marker in ("🏁 시사점", "🏁"):
                    end_idx = segment.find(end_marker)
                    if end_idx >= 0:
                        segment = segment[:end_idx].strip()
                        break
                if segment:
                    text = segment
                    break
    # 3) 본론/상세 없으면 서론(핵심) 블록 시도
    if text == full_summary.strip():
        for start_marker in ("[서론]", "[서론]\n", "💡 핵심 요약", "💡"):
            idx = text.find(start_marker)
            if idx >= 0:
                start = idx + len(start_marker)
                segment = text[start:].strip()
                for end_marker in ("[본론]", "📖", "🏁"):
                    end_idx = segment.find(end_marker)
                    if end_idx >= 0:
                        segment = segment[:end_idx].strip()
                        break
                if segment:
                    text = segment
                    break
    # 4) 첫 문단만 (이중 줄바꿈 전까지)
    if "\n\n" in text and text == full_summary.strip():
        text = text.split("\n\n", 1)[0].strip()
    # 5) max_chars 초과 시 문장 경계에서 자르기
    if len(text) <= max_chars:
        return text.replace("\n", " ")
    cut = text[: max_chars + 1]
    last_dot = max(cut.rfind("."), cut.rfind("。"), cut.rfind("요."))
    if last_dot > max_chars // 2:
        return cut[: last_dot + 1].strip().replace("\n", " ")
    return cut[:max_chars].rstrip().replace("\n", " ") + "…"


def build_pdf(payload: dict[str, Any]) -> bytes:
    """
    Java에서 전달한 DTO(JSON)로 PDF 생성 후 바이트 반환
    신문형: 제호 → 1면 리드(이미지+제목+요약) → 2단 그리드 → 푸터
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm,
    )
    styles = getSampleStyleSheet()

    # 스타일: 신문 톤
    masthead_style = ParagraphStyle(
        "Masthead",
        parent=styles["Heading1"],
        fontName=DEFAULT_FONT,
        fontSize=20,
        spaceAfter=2,
        textColor=colors.HexColor("#1a1a1a"),
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontName=DEFAULT_FONT,
        fontSize=9,
        spaceAfter=6,
        textColor=colors.HexColor("#555"),
    )
    lead_title_style = ParagraphStyle(
        "LeadTitle",
        parent=styles["Heading1"],
        fontName=DEFAULT_FONT,
        fontSize=16,
        spaceAfter=4,
        textColor=colors.HexColor("#1a1a1a"),
    )
    lead_body_style = ParagraphStyle(
        "LeadBody",
        parent=styles["Normal"],
        fontName=DEFAULT_FONT,
        fontSize=10,
        spaceAfter=4,
        leading=14,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=styles["Normal"],
        fontName=DEFAULT_FONT,
        fontSize=9,
        spaceAfter=2,
        textColor=colors.HexColor("#666"),
    )
    grid_title_style = ParagraphStyle(
        "GridTitle",
        parent=styles["Normal"],
        fontName=DEFAULT_FONT,
        fontSize=10,
        spaceAfter=2,
        leftIndent=0,
    )
    grid_body_style = ParagraphStyle(
        "GridBody",
        parent=styles["Normal"],
        fontName=DEFAULT_FONT,
        fontSize=8,
        spaceAfter=3,
        textColor=colors.HexColor("#444"),
        leading=11,
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName=DEFAULT_FONT,
        fontSize=7,
        textColor=colors.gray,
    )

    story = []

    # ----- 1. 제호 (Masthead) -----
    userName = payload.get("userName") or "고객"
    publishDate = payload.get("publishDate") or ""
    story.append(Paragraph("NewsPulse", masthead_style))
    story.append(Paragraph(f"발행일 {publishDate} · {userName} · 맞춤형 브리핑", subtitle_style))
    # 구분선
    line_table = Table([[""]], colWidths=[doc.width], rowHeights=[1.5 * mm])
    line_table.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#e0e0e0"))]))
    story.append(line_table)
    story.append(Spacer(1, 6 * mm))

    # ----- 2. 1면 리드 (Lead): 이미지 좌측 + 제목·요약·QR 우측 -----
    lead = payload.get("leadArticle")
    if lead:
        lead_title = (lead.get("title") or "").strip() or "(제목 없음)"
        lead_summary = (lead.get("summary") or "").strip() or ""
        lead_url = (lead.get("originalUrl") or "").strip()
        lead_image_url = (lead.get("image") or "").strip()

        lead_content_right = [Paragraph(lead_title, lead_title_style)]
        if lead_summary:
            summary_short = _summary_for_pdf(lead_summary, 400)
            if summary_short:
                lead_content_right.append(Paragraph(summary_short.replace("\n", "<br/>"), lead_body_style))
        qr_bytes = _make_qr_image(lead_url, 28)
        if qr_bytes:
            try:
                lead_content_right.append(Image(io.BytesIO(qr_bytes), width=22 * mm, height=22 * mm))
            except Exception:
                pass

        col_width = (doc.width - 4 * mm) / 2
        left_cell = []
        if lead_image_url:
            img_bytes = _fetch_image_bytes(lead_image_url)
            if img_bytes:
                try:
                    left_cell.append(Image(io.BytesIO(img_bytes), width=col_width - 2 * mm, height=50 * mm))
                except Exception as e:
                    logger.warning("리드 이미지 삽입 실패: %s", e)
        if not left_cell:
            left_cell.append(Paragraph(" ", lead_body_style))

        right_cell = lead_content_right
        lead_table = Table(
            [[left_cell, right_cell]],
            colWidths=[col_width, col_width],
            rowHeights=None,
        )
        lead_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (0, -1), 0),
            ("RIGHTPADDING", (0, 0), (0, -1), 4 * mm),
            ("LEFTPADDING", (1, 0), (1, -1), 0),
        ]))
        story.append(lead_table)
        story.append(Spacer(1, 8 * mm))

    # ----- 3. 2단 그리드 (카테고리별 뉴스) -----
    grid = payload.get("gridArticles") or []
    if grid:
        story.append(Paragraph("<b>카테고리별 뉴스</b>", section_style))
        story.append(Spacer(1, 3 * mm))

        # 2열: 기사 셀을 2개씩 묶어서 행으로
        grid_cells = []
        for i in range(0, len(grid), 2):
            row_cells = []
            for j in range(2):
                if i + j < len(grid):
                    item = grid[i + j]
                    cat = (item.get("category") or "").strip() or "기타"
                    title = (item.get("title") or "").strip() or "(제목 없음)"
                    raw_summary = (item.get("summary") or "").strip()
                    summary = _summary_for_pdf(raw_summary, 180)
                    url = (item.get("originalUrl") or "").strip()
                    label = _category_label(cat)
                    cell_story = [
                        Paragraph(f'<font color="#666666" size="9">[{label}]</font>', section_style),
                        Paragraph(f"<b>{title}</b>", grid_title_style),
                    ]
                    if summary:
                        cell_story.append(Paragraph(summary.replace("\n", " "), grid_body_style))
                    qr_bytes = _make_qr_image(url, 12)
                    if qr_bytes:
                        try:
                            cell_story.append(Image(io.BytesIO(qr_bytes), width=12 * mm, height=12 * mm))
                        except Exception:
                            pass
                    row_cells.append(cell_story)
                else:
                    row_cells.append([Paragraph(" ", grid_body_style)])
            grid_cells.append(row_cells)

        col_w = (doc.width - 4 * mm) / 2
        grid_table = Table(grid_cells, colWidths=[col_w, col_w], repeatRows=0)
        grid_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (0, -1), 0),
            ("RIGHTPADDING", (0, 0), (0, -1), 4 * mm),
            ("LEFTPADDING", (1, 0), (1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * mm),
        ]))
        story.append(grid_table)
        story.append(Spacer(1, 6 * mm))

    # ----- 4. 푸터 -----
    story.append(Paragraph(
        "본 서비스는 언론사 기사를 AI로 요약한 것이며, QR 스캔으로 원문을 확인하실 수 있습니다.",
        footer_style,
    ))
    scheduled_log = payload.get("scheduledTimeLog") or ""
    if scheduled_log:
        story.append(Paragraph(scheduled_log, footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
