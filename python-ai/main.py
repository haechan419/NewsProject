# main.py - AI 챗봇 FastAPI 서버 (링크 누락 수정판)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from openai import OpenAI
import os
from dotenv import load_dotenv
import logging
import base64
from io import BytesIO
from PIL import Image
import json
from pathlib import Path
import shutil
from datetime import datetime

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 검색 서비스 import
from search_service import SearchService

# 실시간 검색어 서비스 import
from trending_service import trending_service

# FastAPI 앱 생성
app = FastAPI(
    title="AI Chat API",
    description="GPT-4o-mini 기반 AI 챗봇 API (Tavily 검색 지원)",
    version="1.0.0"
)

# CORS 설정
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

# 검색 서비스 초기화
search_service = SearchService(client)

# 얼굴 데이터 저장 디렉토리
FACE_DATA_DIR = Path("face_data")
FACE_DATA_DIR.mkdir(exist_ok=True)


# ===== 앱 시작/종료 이벤트 =====
@app.on_event("startup")
async def startup_event():
    """앱 시작 시 실행"""
    import asyncio
    logger.info("🚀 FastAPI 앱 시작")
    # 실시간 검색어 백그라운드 갱신 시작
    asyncio.create_task(trending_service.start_background_update())
    logger.info("✅ 실시간 검색어 백그라운드 갱신 태스크 시작됨")


@app.on_event("shutdown")
async def shutdown_event():
    """앱 종료 시 실행"""
    logger.info("🛑 FastAPI 앱 종료")
    trending_service.stop_background_update()


# ===== Pydantic 모델 =====
class ConversationMessage(BaseModel):
    """대화 메시지"""
    role: str
    content: str


class ChatRequest(BaseModel):
    """채팅 요청"""
    message: str
    conversation_history: Optional[List[ConversationMessage]] = None


class SearchSource(BaseModel):
    """검색 출처"""
    title: str
    url: str
    snippet: str


class TrendingKeyword(BaseModel):
    """실시간 검색어 항목"""
    rank: int
    keyword: str
    state: Optional[str] = ""  # s=유지, n=신규, +=상승


class TrendingData(BaseModel):
    """실시간 검색어 데이터"""
    keywords: List[TrendingKeyword]
    updated_at: Optional[str] = None
    source: str = "signal.bz"


class ChatResponse(BaseModel):
    """채팅 응답"""
    reply: str
    searched: bool = False
    search_query: Optional[str] = None
    sources: Optional[List[SearchSource]] = None
    # 실시간 검색어 관련 필드 추가
    is_trending: bool = False
    trending_data: Optional[TrendingData] = None


class QaRequest(BaseModel):
    """Q&A 요청 (FAQ 정보 포함)"""
    message: str
    faq_data: Optional[List[Dict[str, str]]] = None  # FAQ 정보
    conversation_history: Optional[List[ConversationMessage]] = None


class QaResponse(BaseModel):
    """Q&A 응답"""
    reply: str


# ===== 얼굴 인식 관련 모델 (유지) =====
class FaceRegisterRequest(BaseModel):
    image_base64: str
    user_id: str
    user_name: Optional[str] = None


class FaceRegisterResponse(BaseModel):
    success: bool
    message: str
    face_detected: bool
    face_description: Optional[str] = None
    error: Optional[str] = None


class FaceRecognitionRequest(BaseModel):
    image_base64: str
    user_id: Optional[str] = None


class FaceRecognitionResponse(BaseModel):
    success: bool
    face_detected: bool
    face_count: int
    description: Optional[str] = None
    matched_user_id: Optional[str] = None
    matched_user_name: Optional[str] = None
    confidence: Optional[float] = None
    error: Optional[str] = None


# ===== 시스템 프롬프트 =====
def get_system_prompt(include_date: bool = True):
    """시스템 프롬프트 생성"""
    current_time = datetime.now().strftime("%Y년 %m월 %d일 %H:%M:%S")
    current_date = datetime.now().strftime("%Y년 %m월 %d일")
    
    if include_date:
        # 날짜 정보가 필요한 경우 (검색 기반 질문)
        return f"""당신은 친절하고 도움이 되는 AI 어시스턴트입니다.

**현재 시각: {current_time}**
**오늘 날짜: {current_date}**

🔴 **절대 규칙 (반드시 준수):**
1. **모든 정보는 {current_date} 기준으로만 답변하세요.**
2. **시간에 민감한 정보(금융 시세, 뉴스, 날씨, 주가, 암호화폐 가격 등)는 반드시 {current_date} 기준의 최신 정보만 사용하세요.**
3. **훈련 데이터의 오래된 정보는 절대 사용하지 마세요.**
4. **금융 정보(주식, 암호화폐, 환율 등)는 검색 결과가 있을 때만 제공하세요.**
5. **검색 결과가 없으면 "최신 정보를 찾을 수 없습니다"라고 명시하세요.**
6. **답변 시작 시 반드시 "{current_date} 기준"이라고 명시하세요.**

사용자의 질문에 명확하고 간결하게 답변해주세요.
한국어로 대화합니다.
전문적이면서도 친근한 톤을 유지합니다."""
    else:
        # 날짜 정보가 필요 없는 경우 (인사, 자기소개, 개념 질문 등)
        return """당신은 친절하고 도움이 되는 AI 어시스턴트입니다.

사용자의 질문에 명확하고 간결하게 답변해주세요.
한국어로 대화합니다.
전문적이면서도 친근한 톤을 유지합니다.
날짜나 시간 정보를 언급하지 않고 자연스럽게 답변하세요."""

SYSTEM_PROMPT = get_system_prompt(include_date=True)
SYSTEM_PROMPT_SIMPLE = get_system_prompt(include_date=False)

FACE_ANALYSIS_PROMPT = """이 이미지를 분석하여 사람의 얼굴이 있는지 확인해주세요.
(얼굴 인식 프롬프트 생략 - 기존과 동일)
"""


# ===== 얼굴 인식 유틸리티 함수 (기존 코드 유지) =====
def analyze_face_with_openai(image_base64: str) -> dict:
    """OpenAI Vision API를 사용하여 얼굴 분석"""
    try:
        json_prompt = FACE_ANALYSIS_PROMPT + "\n\n반드시 유효한 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요."
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": json_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}}
                    ]
                }
            ],
            max_tokens=500,
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        content = response.choices[0].message.content
        if not content:
            return {"face_detected": False, "face_count": 0, "quality": "poor"}
            
        return json.loads(content)
        
    except Exception as e:
        logger.error(f"OpenAI 얼굴 분석 에러: {str(e)}")
        return {"face_detected": False, "face_count": 0, "quality": "poor"}


def save_face_data(user_id: str, user_name: Optional[str], image_base64: str, face_description: str):
    """얼굴 데이터를 파일로 저장"""
    try:
        user_dir = FACE_DATA_DIR / user_id
        user_dir.mkdir(exist_ok=True)
        
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        image_path = user_dir / "face_image.png"
        image.save(image_path, "PNG")
        
        metadata = {
            "user_id": user_id,
            "user_name": user_name,
            "face_description": face_description,
            "image_path": str(image_path)
        }
        
        with open(user_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f"데이터 저장 에러: {e}")
        raise


def load_face_data(user_id: str) -> Optional[dict]:
    try:
        path = FACE_DATA_DIR / user_id / "metadata.json"
        if not path.exists(): return None
        with open(path, "r", encoding="utf-8") as f: return json.load(f)
    except: return None


def compare_faces(desc1: str, desc2: str) -> float:
    set1 = set(desc1.lower().split())
    set2 = set(desc2.lower().split())
    if not set2: return 0.0
    return len(set1.intersection(set2)) / max(len(set1), len(set2))


def find_matching_user(face_description: str) -> Optional[dict]:
    best_match = None
    best_conf = 0.0
    for user_dir in FACE_DATA_DIR.iterdir():
        if not user_dir.is_dir(): continue
        meta = load_face_data(user_dir.name)
        if not meta: continue
        conf = compare_faces(face_description, meta.get("face_description", ""))
        if conf > best_conf:
            best_conf = conf
            best_match = {"user_id": meta["user_id"], "user_name": meta["user_name"], "confidence": conf}
    if best_conf >= 0.3: return best_match
    return None


# ===== API 엔드포인트 =====
@app.get("/")
async def root():
    return {"status": "ok", "message": "AI Chat API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "openai_configured": bool(os.getenv("OPENAI_API_KEY"))}


@app.get("/trending")
async def get_trending():
    """
    실시간 인기 검색어 조회 API
    5분마다 자동 갱신되는 캐시된 데이터 반환
    """
    logger.info("🔥 실시간 검색어 조회 요청")
    cache = trending_service.get_cached_keywords()
    
    if not cache.get("keywords"):
        # 캐시가 비어있으면 즉시 갱신 시도
        logger.info("캐시가 비어있어 즉시 갱신 시도...")
        await trending_service.update_cache()
        cache = trending_service.get_cached_keywords()
    
    if not cache.get("keywords"):
        raise HTTPException(
            status_code=503,
            detail="현재 인기 검색어를 조회할 수 없습니다. 잠시 후 다시 시도해주세요."
        )
    
    return {
        "keywords": cache.get("keywords", []),
        "updated_at": cache.get("updated_at"),
        "source": cache.get("source", "signal.bz")
    }


# [수정됨] 채팅 엔드포인트 - 링크 누락 문제 해결 + 실시간 검색어 지원
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 채팅 엔드포인트
    - 실시간 검색어 질문 감지 시 trending_service 사용
    - 일반 질문은 기존 검색 서비스 사용
    """
    logger.info(f"채팅 요청 수신: {request.message[:50]}...")
    
    try:
        # Step 0: 실시간 검색어 관련 질문인지 먼저 확인
        if trending_service.is_trending_question(request.message):
            logger.info("🔥 실시간 검색어 질문 감지됨 - trending_service 사용")
            trending_result = trending_service.format_trending_response()
            
            # TrendingData 변환
            trending_data = None
            if trending_result.get("trending_data"):
                td = trending_result["trending_data"]
                trending_data = TrendingData(
                    keywords=[TrendingKeyword(**kw) for kw in td.get("keywords", [])],
                    updated_at=td.get("updated_at"),
                    source=td.get("source", "signal.bz")
                )
            
            return ChatResponse(
                reply=trending_result["reply"],
                searched=False,
                is_trending=True,
                trending_data=trending_data
            )
        
        # Step 1: 검색 서비스로 메시지 처리 (기존 로직)
        search_result = search_service.process_message(
            message=request.message,
            conversation_history=[
                {"role": msg.role, "content": msg.content}
                for msg in (request.conversation_history or [])
            ]
        )
        
        # 검색 결과(sources) 안전하게 변환하는 헬퍼 함수
        def get_safe_sources(result_dict):
            sources = []
            if result_dict.get("sources"):
                for src in result_dict["sources"]:
                    try:
                        # 필수 필드가 있는지 확인 후 추가
                        if src.get("title") and src.get("url"):
                            sources.append(SearchSource(**src))
                    except Exception as e:
                        logger.warning(f"소스 변환 중 오류 (무시함): {e}")
                        continue
            return sources

        # Step 2: 검색 서비스가 답변(Reply)까지 완성해서 준 경우
        if search_result.get("reply"):
            logger.info(f"검색 기반 응답 생성 완료")
            return ChatResponse(
                reply=search_result["reply"],
                searched=True,
                search_query=search_result.get("search_query"),
                sources=get_safe_sources(search_result)
            )
        
        # Step 3: 검색 서비스가 답변을 못 줬거나(None), 검색 결과만 있는 경우
        # 일반 GPT 응답 생성
        current_time = datetime.now().strftime("%Y년 %m월 %d일 %H:%M:%S")
        current_date = datetime.now().strftime("%Y년 %m월 %d일")
        
        # 검색이 스킵되었는지 확인 (검색이 필요 없는 질문인 경우)
        is_search_skipped = search_result.get("searched") == False and not search_result.get("reply")
        
        # 검색이 스킵된 경우는 날짜 정보 없는 시스템 프롬프트 사용
        system_prompt = SYSTEM_PROMPT_SIMPLE if is_search_skipped else SYSTEM_PROMPT
        messages = [{"role": "system", "content": system_prompt}]
        
        if request.conversation_history:
            for msg in request.conversation_history:
                messages.append({"role": msg.role, "content": msg.content})
        
        # 검색이 스킵된 경우(인사, 자기소개, 개념 질문 등)는 날짜 정보를 포함하지 않음
        if is_search_skipped:
            # 간단한 질문은 날짜 정보 없이 자연스럽게 답변
            messages.append({"role": "user", "content": request.message})
        else:
            # 검색을 시도했지만 결과가 없는 경우는 날짜 정보 포함
            user_message_with_time = f"""⚠️ 중요: 현재 날짜는 {current_date}입니다. 모든 정보는 이 날짜 기준으로만 답변하세요.

{request.message}

**반드시 {current_date} 기준의 최신 정보만 사용하고, 훈련 데이터의 오래된 정보는 절대 사용하지 마세요.**"""
            messages.append({"role": "user", "content": user_message_with_time})
        
        # 금융 정보인지 확인하여 temperature 조정
        financial_keywords = ['가격', '시세', '시장가', '현재가', '비트코인', 'BTC', '이더리움', 'ETH', 
                             '주식', '코인', '암호화폐', '가상화폐', '환율', '금리', '시가총액', '거래량',
                             '삼성전자', 'SK하이닉스', 'LG', '현대차', '기아', '네이버', '카카오']
        is_financial = any(keyword in request.message for keyword in financial_keywords)
        temperature = 0.3 if is_financial else 0.5
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=temperature,
        )
        reply = response.choices[0].message.content
        logger.info(f"일반 GPT 응답 생성 완료: {reply[:50]}...")
        
        # [중요 수정] 검색은 시도했고(searched=True), 결과(sources)가 있다면
        # 일반 응답이라도 링크를 반드시 포함해서 반환!
        if search_result.get("searched"):
            logger.info("일반 응답에 검색 출처를 병합합니다.")
            return ChatResponse(
                reply=reply,
                searched=True,
                search_query=search_result.get("search_query"),
                sources=get_safe_sources(search_result)  # 기존에는 여기서 []를 반환해서 문제였음
            )
        
        return ChatResponse(reply=reply, searched=False)
        
    except Exception as e:
        logger.error(f"채팅 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI 응답 생성 중 오류: {str(e)}")


# ===== 얼굴 인식 API 엔드포인트 (기존 코드 유지) =====
@app.post("/face/register", response_model=FaceRegisterResponse)
async def register_face(request: FaceRegisterRequest):
    # (기존 코드와 동일 - 생략 없이 그대로 사용하세요)
    logger.info(f"얼굴 등록 요청: {request.user_id}")
    try:
        if "," in request.image_base64: img_b64 = request.image_base64.split(",")[1]
        else: img_b64 = request.image_base64
        
        img_data = base64.b64decode(img_b64)
        img = Image.open(BytesIO(img_data))
        buf = BytesIO()
        img.save(buf, format="PNG")
        img_png = base64.b64encode(buf.getvalue()).decode()
        
        res = analyze_face_with_openai(img_png)
        if not res.get("face_detected"):
            return FaceRegisterResponse(success=False, message="얼굴 미감지", face_detected=False, error="No face")
            
        save_face_data(request.user_id, request.user_name, img_png, res.get("face_description", ""))
        return FaceRegisterResponse(success=True, message="등록 완료", face_detected=True)
    except Exception as e:
        logger.error(f"등록 에러: {e}")
        return FaceRegisterResponse(success=False, message=str(e), face_detected=False, error=str(e))

@app.post("/face/recognize", response_model=FaceRecognitionResponse)
async def recognize_face(request: FaceRecognitionRequest):
    # (기존 코드와 동일)
    try:
        if "," in request.image_base64: img_b64 = request.image_base64.split(",")[1]
        else: img_b64 = request.image_base64
        
        img_data = base64.b64decode(img_b64)
        img = Image.open(BytesIO(img_data))
        buf = BytesIO()
        img.save(buf, format="PNG")
        img_png = base64.b64encode(buf.getvalue()).decode()
        
        res = analyze_face_with_openai(img_png)
        if not res.get("face_detected"):
            return FaceRecognitionResponse(success=True, face_detected=False, face_count=0)
            
        match = find_matching_user(res.get("face_description", ""))
        return FaceRecognitionResponse(
            success=True, face_detected=True, face_count=res.get("face_count", 1),
            matched_user_id=match["user_id"] if match else None,
            matched_user_name=match["user_name"] if match else None,
            confidence=match["confidence"] if match else None
        )
    except Exception as e:
        logger.error(f"인식 에러: {e}")
        return FaceRecognitionResponse(success=False, face_detected=False, face_count=0, error=str(e))

@app.delete("/face/{user_id}")
async def delete_face(user_id: str):
    try:
        path = FACE_DATA_DIR / user_id
        if path.exists(): shutil.rmtree(path)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/face/{user_id}")
async def get_face_info(user_id: str):
    meta = load_face_data(user_id)
    if not meta: raise HTTPException(status_code=404)
    return {"user_id": meta["user_id"], "user_name": meta["user_name"], "registered": True}


# ===== Q&A 챗봇 엔드포인트 (FAQ 기반) =====
@app.post("/qa", response_model=QaResponse)
async def qa_chat(request: QaRequest):
    """
    Q&A 챗봇 엔드포인트 (FAQ 기반)
    FAQ 데이터베이스 정보를 받아서 GPT-4o-mini로 답변 생성
    """
    logger.info(f"Q&A 요청 수신: {request.message[:50]}...")
    logger.info(f"FAQ 데이터 수신: {len(request.faq_data) if request.faq_data else 0}건")
    
    try:
        # 인사말 및 자기소개 질문 감지 (FAQ 없이 처리)
        greeting_keywords = ['안녕', '안녕하세요', '안녕하셨습니까', '하이', 'hi', 'hello', '반가워', '반갑습니다', '좋은 아침', '좋은 저녁', '안녕히가세요', '안녕히계세요']
        self_intro_keywords = ['당신은', '너는', '너는 누구', '당신은 누구', '누구세요', '누구야', '소개', '자기소개', '뭐하는', '무엇을', '역할', '기능', '뭐야', '뭐하는거야', '뭐하는 거야', '뭐하는거', '뭐하는 거']
        user_message_lower = request.message.lower().strip()
        is_greeting = any(keyword in user_message_lower for keyword in greeting_keywords) or len(user_message_lower) <= 5
        is_self_intro = any(keyword in user_message_lower for keyword in self_intro_keywords)
        
        # 인사말이나 자기소개 질문인 경우 FAQ 없이도 답변
        if is_greeting or is_self_intro:
            logger.info(f"{'인사말' if is_greeting else '자기소개 질문'}로 판단하여 FAQ 없이 처리")
            if is_greeting:
                system_prompt = """당신은 뉴스 플랫폼 고객센터의 친절한 AI 상담원입니다.
사용자의 인사에 친절하게 응답하고, 어떤 도움을 드릴 수 있는지 안내해주세요.
한국어로 대화하며, 존댓말을 사용합니다."""
            else:
                system_prompt = """당신은 뉴스 플랫폼 고객센터의 친절한 AI 상담원입니다.
사용자에게 자신을 소개하고, 어떤 도움을 드릴 수 있는지 설명해주세요.
- 뉴스 플랫폼의 고객센터 AI 상담원임을 명확히 알려주세요
- 서비스 이용 관련 질문에 도움을 드릴 수 있다고 안내하세요
- 영상 제작, 게시물 작성, 프로필/계정 관리 등 서비스 이용 관련 질문을 받을 수 있다고 설명하세요
한국어로 대화하며, 존댓말을 사용합니다."""
            
            messages = [{"role": "system", "content": system_prompt}]
            if request.conversation_history:
                for msg in request.conversation_history:
                    messages.append({"role": msg.role, "content": msg.content})
            messages.append({"role": "user", "content": request.message})
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )
            reply = response.choices[0].message.content
            logger.info(f"{'인사말' if is_greeting else '자기소개'} 응답 생성 완료: {reply[:50]}...")
            return QaResponse(reply=reply)
        
        # FAQ 데이터 로깅
        has_faq_data = request.faq_data and len(request.faq_data) > 0
        if has_faq_data:
            for i, faq in enumerate(request.faq_data, 1):
                logger.info(f"FAQ {i}: 카테고리={faq.get('category', 'N/A')}, 질문={faq.get('question', 'N/A')[:50]}...")
        
        # 시스템 프롬프트 생성 (FAQ 정보 포함)
        system_prompt = """당신은 뉴스 플랫폼 고객센터의 친절한 AI 상담원입니다.

규칙:
1. 사용자의 질문이 서비스 이용과 관련된 것인지 먼저 판단하세요.
   - 서비스 이용 관련: 영상 제작, 게시물 작성, 프로필/계정, 로그인, 회원가입, 비밀번호 찾기, 문의하기, 계정 설정, 프로필 수정 등
   - 서비스 이용과 무관: 일반적인 개념 질문(야당이 뭐야, 산불 어디서 났어, 비트코인이 뭐야 등), 뉴스 질문, 정치/경제 일반 상식 등
2. 서비스 이용과 관련된 질문이면 FAQ 정보를 참고하여 답변하세요.
3. 서비스 이용과 무관한 일반적인 질문이면 "죄송합니다. 질문하신 내용에 대한 FAQ 정보를 찾을 수 없습니다. 서비스 이용 관련 질문만 답변해드릴 수 있습니다. 추가 문의사항이 있으시면 '문의 티켓 작성'을 통해 문의해주시면 관리자가 확인 후 답변드리겠습니다."라고 답변하세요.
4. 한국어로 대화하며, 존댓말을 사용합니다.
5. 답변은 명확하고 이해하기 쉽게 작성하세요.\n\n"""
        
        if has_faq_data:
            system_prompt += "다음은 참고할 수 있는 FAQ 정보입니다:\n\n"
            for i, faq in enumerate(request.faq_data, 1):
                system_prompt += f"--- FAQ {i} ---\n"
                system_prompt += f"카테고리: {faq.get('category', '')}\n"
                system_prompt += f"질문: {faq.get('question', '')}\n"
                system_prompt += f"답변: {faq.get('answer', '')}\n\n"
            system_prompt += """위 FAQ 정보를 참고하여 사용자의 질문에 답변해주세요.
FAQ에 관련된 내용이 있으면 반드시 해당 FAQ의 답변을 바탕으로 답변하세요."""
        else:
            system_prompt += """FAQ 정보가 없으므로, 사용자의 질문이 서비스 이용과 관련된 것인지 먼저 판단하세요.
서비스 이용과 관련된 질문이면 도움이 되는 답변을 제공하고,
서비스 이용과 무관한 일반적인 질문이면 위 규칙 3번에 따라 답변하세요."""
        
        # 메시지 구성
        messages = [{"role": "system", "content": system_prompt}]
        
        # 이전 대화 기록
        if request.conversation_history:
            for msg in request.conversation_history:
                messages.append({"role": msg.role, "content": msg.content})
        
        # 현재 사용자 메시지
        messages.append({"role": "user", "content": request.message})
        
        # GPT-4o-mini 호출
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.3,  # FAQ 기반 답변이므로 낮은 temperature 사용
        )
        
        reply = response.choices[0].message.content
        logger.info(f"Q&A 응답 생성 완료: {reply[:50]}...")
        
        return QaResponse(reply=reply)
        
    except Exception as e:
        logger.error(f"Q&A 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI 응답 생성 중 오류: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True, log_level="info")