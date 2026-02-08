# main.py - AI 챗봇 FastAPI 서버 (링크 누락 수정판)
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict
from openai import OpenAI
import os
import threading # 추가: 스레딩 지원
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import logging
import base64
from io import BytesIO
from PIL import Image
import json
from pathlib import Path
import shutil
from datetime import datetime
from search_service import SearchService
from trending_service import trending_service

# 사용자 정의 모듈 임포트
try:
    from video_worker import run_engine
    print("[Success] 영상 엔진 로드 완료")
except Exception as e:
    run_engine = None
    print(f"[Error] 영상 엔진 로드 실패: {e}")
except ImportError:
    run_engine = None

# 환경 변수 로드 (.env 파일 읽기)
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 검색 서비스 import
from search_service import SearchService

# 실시간 검색어 서비스 import
from trending_service import trending_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    """서버 시작/종료 시 실행 (드라이브 모드 고정 멘트 생성 등)"""
    async def generate_fixed_audio_background():
        try:
            if not os.getenv("OPENAI_API_KEY"):
                return
            from drive.generate_fixed_audio import generate_all_fixed_audio
            await generate_all_fixed_audio()
        except Exception as e:
            logger.warning("드라이브 고정 멘트 생성 중 오류 (무시): %s", e)
    asyncio.create_task(generate_fixed_audio_background())
    yield


# FastAPI 앱 생성
app = FastAPI(title="AI Chat & Video API", version="1.0.0")

# CORS 설정 (Spring Boot 및 React 연동 허용)
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

# 드라이브 모드 라우터 및 정적 파일
from drive.router import router as drive_router
app.include_router(drive_router)

# 브리핑 배송 라우터
from brief_delivery.router import router as brief_delivery_router
app.include_router(brief_delivery_router)

# 환율 API 클라이언트 임포트
try:
    from exchange_rate import ExchangeRateClient, ExchangeRate
    exchange_rate_client = ExchangeRateClient()
    logger.info("[Success] 환율 API 클라이언트 로드 완료")
except Exception as e:
    exchange_rate_client = None
    logger.warning(f"[Warning] 환율 API 클라이언트 로드 실패: {e}")

# 환율 크롤러 임포트
try:
    from exchange_rate_crawler import ExchangeRateCrawler
    exchange_rate_crawler = ExchangeRateCrawler()
    logger.info("[Success] 환율 크롤러 로드 완료")
except Exception as e:
    exchange_rate_crawler = None
    logger.warning(f"[Warning] 환율 크롤러 로드 실패: {e}")

# 주가지수 크롤러 임포트
try:
    from stock_index_crawler import StockIndexCrawler
    stock_index_crawler = StockIndexCrawler()
    logger.info("[Success] 주가지수 크롤러 로드 완료")
except Exception as e:
    stock_index_crawler = None
    logger.warning(f"[Warning] 주가지수 크롤러 로드 실패: {e}")
_DRIVE_STATIC = Path(__file__).resolve().parent / "drive" / "static"
if _DRIVE_STATIC.exists():
    app.mount("/static", StaticFiles(directory=str(_DRIVE_STATIC)), name="drive_static")

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 검색 서비스 초기화
search_service = SearchService(client)

# 서버 시작 시 영상 엔진 자동 가동
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 FastAPI 앱 가동 시작")

    # 영상 제작 엔진 가동 (Thread)
    if run_engine:
        video_thread = threading.Thread(target=run_engine, daemon=True)
        video_thread.start()
        logger.info("🎬 [System] AI 영상 제작 엔진이 통합 가동되었습니다.")

    # 실시간 검색어 백그라운드 갱신 시작 (asyncio)
    import asyncio
    asyncio.create_task(trending_service.start_background_update())
    logger.info("✅ 실시간 검색어 백그라운드 갱신 태스크 시작됨")
# 생존 확인 엔드포인트
@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "AI Chat & Video API is running",
        "video_engine": "Active" if run_engine else "Missing"
    }

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
    role: str  # "user" 또는 "assistant"
    content: str

# 기존 ChatResponse 클래스 아래에 추가
class VideoGenerationRequest(BaseModel):
    """자바에서 보낸 영상 제작 요청 데이터 규격"""
    vno: int
    rawText: str
    videoMode: str

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


# ===== 얼굴 인식 관련 모델 =====
class FaceRegisterRequest(BaseModel):
    """얼굴 등록 요청"""
    image_base64: str  # Base64 인코딩된 이미지
    user_id: str  # 사용자 ID (필수)
    user_name: Optional[str] = None  # 사용자 이름 (선택)


class FaceRegisterResponse(BaseModel):
    """얼굴 등록 응답"""
    success: bool
    message: str
    face_detected: bool
    face_description: Optional[str] = None
    error: Optional[str] = None


class FaceRecognitionRequest(BaseModel):
    """얼굴 인식 요청"""
    image_base64: str  # Base64 인코딩된 이미지
    user_id: Optional[str] = None  # 사용자 ID (선택)


class FaceRecognitionResponse(BaseModel):
    """얼굴 인식 응답"""
    success: bool
    face_detected: bool
    face_count: int
    description: Optional[str] = None
    matched_user_id: Optional[str] = None  # 매칭된 사용자 ID
    matched_user_name: Optional[str] = None  # 매칭된 사용자 이름
    confidence: Optional[float] = None  # 매칭 신뢰도
    error: Optional[str] = None


# ===== 환율 관련 모델 =====
class ExchangeRateResponse(BaseModel):
    """환율 정보 응답"""
    cur_unit: str
    cur_nm: str
    deal_bas_r: Optional[str] = None  # Decimal을 문자열로 변환
    ttb: Optional[str] = None
    tts: Optional[str] = None
    bkpr: Optional[str] = None

    @classmethod
    def from_exchange_rate(cls, rate):
        """ExchangeRate 객체를 ExchangeRateResponse로 변환"""
        from exchange_rate import ExchangeRate
        return cls(
            cur_unit=rate.cur_unit,
            cur_nm=rate.cur_nm,
            deal_bas_r=str(rate.deal_bas_r) if rate.deal_bas_r is not None else None,
            ttb=str(rate.ttb) if rate.ttb is not None else None,
            tts=str(rate.tts) if rate.tts is not None else None,
            bkpr=str(rate.bkpr) if rate.bkpr is not None else None
        )


class ExchangeRateListResponse(BaseModel):
    """환율 목록 응답"""
    exchange_rates: List[ExchangeRateResponse]
    count: int
    search_date: Optional[str] = None


# ===== 시스템 프롬프트 =====
def get_system_prompt(include_date: bool = True):
    """시스템 프롬프트 생성"""
    current_time = datetime.now().strftime("%Y년 %m월 %d일 %H:%M:%S")
    current_date = datetime.now().strftime("%Y년 %m월 %d일")

    # 마크다운 형식 규칙 (공통)
    markdown_rules = """
📝 **답변 형식 규칙** (반드시 마크다운 문법을 사용하세요):

1. **굵은 글씨(Bold)**: 중요한 키워드, 인물명, 수치, 기관명은 반드시 **굵게** 표시
   - 예: **삼성전자**, **2026년 02월 04일**, **113,000원**

2. **헤딩(###)**: 내용이 길거나 여러 주제가 있을 때 섹션 제목 사용
   - 예: ### 주요 내용, ### 결론, ### 요약

3. **번호 리스트**: 여러 항목 나열 시 1. 2. 3. 형식 사용
   - 예: 1. 첫 번째 포인트 2. 두 번째 포인트

4. **인용문(>)**: 핵심 메시지, 중요 발언, 결론 강조 시 사용
   - 예: > "이것이 핵심 메시지입니다."

5. **문단 분리**: 내용이 길면 적절히 문단을 나누어 가독성 향상

---
**예시 답변:**

**2026년 02월 04일** 기준, **국제 유가** 전망을 안내해 드리겠습니다.

### 전문가 전망
1. **EIA(에너지정보청)**: 브렌트유 연평균 **55달러** 전망
2. **골드만삭스**: WTI 가격 **53달러** 전망
3. **ABN암로**: 유사한 수준의 보수적 전망

> "글로벌 원유 수요의 제한적 증가와 높은 재고 수준이 주요 요인입니다."

### 결론
전반적으로 **유가 하락 압력**이 지속될 것으로 예상됩니다."""

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
전문적이면서도 친근한 톤을 유지합니다.
{markdown_rules}"""
    else:
        # 날짜 정보가 필요 없는 경우 (인사, 자기소개, 개념 질문 등)
        return f"""당신은 친절하고 도움이 되는 AI 어시스턴트입니다.

사용자의 질문에 명확하고 간결하게 답변해주세요.
한국어로 대화합니다.
전문적이면서도 친근한 톤을 유지합니다.
날짜나 시간 정보를 언급하지 않고 자연스럽게 답변하세요.
{markdown_rules}"""

SYSTEM_PROMPT = get_system_prompt(include_date=True)
SYSTEM_PROMPT_SIMPLE = get_system_prompt(include_date=False)

FACE_ANALYSIS_PROMPT = """이 이미지를 분석하여 사람의 얼굴이 있는지 확인해주세요.

반드시 다음 JSON 형식으로만 응답해주세요:
{
  "face_detected": true 또는 false,
  "face_count": 숫자 (0 이상),
  "face_description": "얼굴이 감지된 경우 상세한 설명, 없으면 빈 문자열",
  "quality": "good" 또는 "fair" 또는 "poor"
}

중요:
- 이미지에 사람의 얼굴이 보이면 반드시 face_detected를 true로 설정하세요
- 얼굴이 명확하게 보이면 face_detected는 true여야 합니다
- 얼굴이 하나도 없을 때만 face_detected를 false로 설정하세요
- face_count는 감지된 얼굴의 개수입니다 (0 이상)

JSON 형식으로만 응답하고 다른 텍스트는 포함하지 마세요."""


# ===== 얼굴 인식 유틸리티 함수 =====
def analyze_face_with_openai(image_base64: str) -> dict:
    """OpenAI Vision API를 사용하여 얼굴 분석"""
    try:
        # 프롬프트에 JSON 형식 명시 추가
        json_prompt = FACE_ANALYSIS_PROMPT + "\n\n반드시 유효한 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요."
        
        response = client.chat.completions.create(
            model="gpt-4o",  # Vision 지원 모델
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": json_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            response_format={"type": "json_object"},
            temperature=0.1  # 일관된 응답을 위해 낮은 temperature 설정
        )
        
        # 응답 내용 확인
        if not response.choices or len(response.choices) == 0:
            logger.error("OpenAI 응답에 choices가 없습니다")
            logger.error(f"전체 응답: {response}")
            return {
                "face_detected": False,
                "face_count": 0,
                "face_description": "",
                "quality": "poor"
            }
        
        choice = response.choices[0]
        message = choice.message
        message_content = message.content
        finish_reason = choice.finish_reason
        
        # 응답 상세 정보 로깅
        logger.info(f"OpenAI 응답 - finish_reason: {finish_reason}, content type: {type(message_content)}")
        
        # None 체크
        if message_content is None:
            logger.error(f"OpenAI 응답 content가 None입니다. finish_reason: {finish_reason}")
            logger.error(f"전체 응답 객체: {response}")
            logger.error(f"Choice 객체: {choice}")
            logger.error(f"Message 객체: {message}")
            
            # finish_reason이 content_filter인 경우 처리
            if finish_reason == "content_filter":
                logger.error("콘텐츠 필터에 의해 응답이 차단되었습니다.")
            elif finish_reason == "length":
                logger.error("응답 길이 제한에 도달했습니다.")
            elif finish_reason == "stop":
                logger.error("응답이 정상적으로 종료되었지만 content가 None입니다.")
            
            return {
                "face_detected": False,
                "face_count": 0,
                "face_description": "",
                "quality": "poor"
            }
        
        # JSON 파싱
        try:
            result = json.loads(message_content)
            logger.info(f"얼굴 분석 결과: {result}")
            
            # 결과 검증 및 기본값 보정
            if "face_detected" not in result:
                logger.warning("face_detected 필드가 없습니다. 기본값으로 설정합니다.")
                result["face_detected"] = result.get("face_count", 0) > 0
            
            if "face_count" not in result:
                logger.warning("face_count 필드가 없습니다. 기본값으로 설정합니다.")
                result["face_count"] = 1 if result.get("face_detected", False) else 0
            
            # face_count가 0보다 크면 face_detected는 true여야 함
            if result.get("face_count", 0) > 0 and not result.get("face_detected", False):
                logger.warning("face_count > 0인데 face_detected가 false입니다. face_detected를 true로 수정합니다.")
                result["face_detected"] = True
            
            # face_detected가 true인데 face_count가 0이면 수정
            if result.get("face_detected", False) and result.get("face_count", 0) == 0:
                logger.warning("face_detected가 true인데 face_count가 0입니다. face_count를 1로 수정합니다.")
                result["face_count"] = 1
            
            logger.info(f"검증 후 얼굴 분석 결과: {result}")
            return result
            
        except json.JSONDecodeError as json_err:
            logger.error(f"JSON 파싱 에러: {str(json_err)}")
            logger.error(f"원본 내용 (처음 500자): {message_content[:500] if message_content else 'None'}")
            
            # JSON 파싱 실패 시 텍스트에서 JSON 부분만 추출 시도
            try:
                import re
                # 더 포괄적인 JSON 패턴 찾기
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', message_content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    logger.info(f"정규식으로 추출한 JSON: {json_str}")
                    result = json.loads(json_str)
                    logger.info(f"정규식으로 추출한 JSON 파싱 성공: {result}")
                    return result
            except Exception as extract_err:
                logger.error(f"JSON 추출 시도 실패: {str(extract_err)}")
            
            # JSON 파싱 실패 시에도 원본 내용에서 얼굴 관련 키워드 확인
            if message_content:
                message_lower = message_content.lower()
                if any(keyword in message_lower for keyword in ['face', '얼굴', 'person', '사람', 'detected', 'true']):
                    logger.warning("JSON 파싱 실패했지만 응답에 얼굴 관련 키워드가 있습니다. 얼굴이 감지된 것으로 간주합니다.")
                    return {
                        "face_detected": True,
                        "face_count": 1,
                        "face_description": "JSON 파싱 실패로 인한 기본값",
                        "quality": "fair"
                    }
            
            # JSON 파싱 실패 시 기본값 반환
            logger.error("JSON 파싱 실패 및 얼굴 키워드도 없음. 얼굴 미감지로 처리합니다.")
            return {
                "face_detected": False,
                "face_count": 0,
                "face_description": "",
                "quality": "poor"
            }
        
    except Exception as e:
        logger.error(f"OpenAI 얼굴 분석 에러: {str(e)}")
        logger.error(f"에러 타입: {type(e).__name__}")
        import traceback
        logger.error(f"트레이스백: {traceback.format_exc()}")
        # 에러 발생 시 기본값 반환
        return {
            "face_detected": False,
            "face_count": 0,
            "face_description": "",
            "quality": "poor"
        }


def save_face_data(user_id: str, user_name: Optional[str], image_base64: str, face_description: str):
    """얼굴 데이터를 파일로 저장"""
    try:
        user_dir = FACE_DATA_DIR / user_id
        user_dir.mkdir(exist_ok=True)
        
        # 이미지 저장
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        image_path = user_dir / "face_image.png"
        image.save(image_path, "PNG")
        
        # 메타데이터 저장
        metadata = {
            "user_id": user_id,
            "user_name": user_name,
            "face_description": face_description,
            "image_path": str(image_path)
        }
        
        metadata_path = user_dir / "metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        logger.info(f"얼굴 데이터 저장 완료: {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"얼굴 데이터 저장 에러: {str(e)}")
        raise


def load_face_data(user_id: str) -> Optional[dict]:
    """저장된 얼굴 데이터 로드"""
    try:
        metadata_path = FACE_DATA_DIR / user_id / "metadata.json"
        if not metadata_path.exists():
            return None
        
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        
        return metadata
        
    except Exception as e:
        logger.error(f"얼굴 데이터 로드 에러: {str(e)}")
        return None


def compare_faces(new_description: str, saved_description: str) -> float:
    """두 얼굴 설명을 비교하여 유사도 반환 (간단한 휴리스틱)"""
    # 실제로는 더 정교한 비교 알고리즘이 필요하지만, 
    # 여기서는 간단한 키워드 매칭으로 구현
    new_words = set(new_description.lower().split())
    saved_words = set(saved_description.lower().split())
    
    if len(saved_words) == 0:
        return 0.0
    
    common_words = new_words.intersection(saved_words)
    similarity = len(common_words) / max(len(new_words), len(saved_words))
    
    return similarity


def find_matching_user(face_description: str) -> Optional[dict]:
    """등록된 얼굴 중에서 매칭되는 사용자 찾기"""
    best_match = None
    best_confidence = 0.0
    
    # 모든 사용자 디렉토리 검색
    for user_dir in FACE_DATA_DIR.iterdir():
        if not user_dir.is_dir():
            continue
        
        metadata = load_face_data(user_dir.name)
        if not metadata:
            continue
        
        saved_description = metadata.get("face_description", "")
        confidence = compare_faces(face_description, saved_description)
        
        if confidence > best_confidence:
            best_confidence = confidence
            best_match = {
                "user_id": metadata.get("user_id"),
                "user_name": metadata.get("user_name"),
                "confidence": confidence
            }
    
    # 신뢰도가 0.3 이상일 때만 매칭으로 간주
    if best_confidence >= 0.3:
        return best_match
    
    return None


# ===== API 엔드포인트 =====
@app.get("/")
async def root():
    """서버 상태 확인"""
    return {
        "status": "ok",
        "message": "AI Chat & Video API is running",
        "video_engine": "Active" if run_engine else "Missing"
    }

@app.post("/generate_video")
async def generate_video(request: VideoGenerationRequest):
    logger.info(f"🚀 [영상 요청 수신] vno: {request.vno}")


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
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
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


# ===== 얼굴 인식 API 엔드포인트 =====
@app.post("/face/register", response_model=FaceRegisterResponse)
async def register_face(request: FaceRegisterRequest):
    """
    얼굴 등록 엔드포인트
    
    - image_base64: Base64 인코딩된 얼굴 이미지
    - user_id: 사용자 ID (필수)
    - user_name: 사용자 이름 (선택)
    """
    logger.info(f"얼굴 등록 요청 수신: user_id={request.user_id}")
    
    try:
        # 입력 데이터 검증
        if not request.image_base64:
            logger.error("이미지 데이터가 없습니다.")
            return FaceRegisterResponse(
                success=False,
                message="이미지 데이터가 필요합니다.",
                face_detected=False,
                error="Missing image data"
            )
        
        if not request.user_id:
            logger.error("사용자 ID가 없습니다.")
            return FaceRegisterResponse(
                success=False,
                message="사용자 ID가 필요합니다.",
                face_detected=False,
                error="Missing user_id"
            )
        
        # Base64에서 이미지 데이터 추출
        if "," in request.image_base64:
            image_base64 = request.image_base64.split(",")[1]
        else:
            image_base64 = request.image_base64
        
        logger.info(f"이미지 데이터 길이: {len(image_base64)}")
        
        # 이미지 디코딩 및 검증
        try:
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
        except Exception as decode_err:
            logger.error(f"이미지 디코딩 에러: {str(decode_err)}")
            return FaceRegisterResponse(
                success=False,
                message="이미지 디코딩에 실패했습니다. 올바른 이미지 파일인지 확인해주세요.",
                face_detected=False,
                error=f"Image decode error: {str(decode_err)}"
            )
        
        # 이미지를 PNG로 변환하여 Base64 재인코딩 (OpenAI API용)
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        image_base64_png = base64.b64encode(buffered.getvalue()).decode()
        
        # 이미지 크기 확인
        image_size = len(image_base64_png)
        logger.info(f"이미지 Base64 크기: {image_size} bytes ({image_size / 1024:.2f} KB)")
        
        # OpenAI Vision API로 얼굴 분석
        logger.info("OpenAI 얼굴 분석 시작...")
        analysis_result = analyze_face_with_openai(image_base64_png)
        logger.info(f"얼굴 분석 결과: {analysis_result}")
        
        # 분석 결과 상세 로깅
        logger.info(f"face_detected: {analysis_result.get('face_detected')}, face_count: {analysis_result.get('face_count')}")
        
        face_detected = analysis_result.get("face_detected", False)
        face_count = analysis_result.get("face_count", 0)
        face_description = analysis_result.get("face_description", "")
        
        if not face_detected or face_count == 0:
            return FaceRegisterResponse(
                success=False,
                message="이미지에서 얼굴을 감지할 수 없습니다. 얼굴이 명확하게 보이는 사진을 업로드해주세요.",
                face_detected=False,
                error="No face detected"
            )
        
        if face_count > 1:
            return FaceRegisterResponse(
                success=False,
                message="이미지에 여러 얼굴이 감지되었습니다. 한 명의 얼굴만 보이는 사진을 업로드해주세요.",
                face_detected=True,
                error="Multiple faces detected"
            )
        
        # 얼굴 데이터 저장
        save_face_data(
            user_id=request.user_id,
            user_name=request.user_name,
            image_base64=image_base64_png,
            face_description=face_description
        )
        
        logger.info(f"얼굴 등록 완료: user_id={request.user_id}")
        
        return FaceRegisterResponse(
            success=True,
            message="얼굴 등록이 완료되었습니다.",
            face_detected=True,
            face_description=face_description
        )
        
    except Exception as e:
        logger.error(f"얼굴 등록 에러: {str(e)}")
        return FaceRegisterResponse(
            success=False,
            message=f"얼굴 등록 중 오류가 발생했습니다: {str(e)}",
            face_detected=False,
            error=str(e)
        )


@app.post("/face/recognize", response_model=FaceRecognitionResponse)
async def recognize_face(request: FaceRecognitionRequest):
    """
    얼굴 인식 엔드포인트
    
    - image_base64: Base64 인코딩된 얼굴 이미지
    - user_id: 사용자 ID (선택, 특정 사용자와 비교할 때 사용)
    """
    logger.info("얼굴 인식 요청 수신")
    
    try:
        # Base64에서 이미지 데이터 추출
        if "," in request.image_base64:
            image_base64 = request.image_base64.split(",")[1]
        else:
            image_base64 = request.image_base64
        
        # 이미지 디코딩
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        
        # 이미지를 PNG로 변환하여 Base64 재인코딩
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        image_base64_png = base64.b64encode(buffered.getvalue()).decode()
        
        # OpenAI Vision API로 얼굴 분석
        analysis_result = analyze_face_with_openai(image_base64_png)
        
        face_detected = analysis_result.get("face_detected", False)
        face_count = analysis_result.get("face_count", 0)
        face_description = analysis_result.get("face_description", "")
        
        if not face_detected:
            return FaceRecognitionResponse(
                success=True,
                face_detected=False,
                face_count=0,
                description="이미지에서 얼굴을 감지할 수 없습니다."
            )
        
        # 특정 사용자와 비교하는 경우
        if request.user_id:
            saved_data = load_face_data(request.user_id)
            if saved_data:
                saved_description = saved_data.get("face_description", "")
                confidence = compare_faces(face_description, saved_description)
                
                return FaceRecognitionResponse(
                    success=True,
                    face_detected=True,
                    face_count=face_count,
                    description=face_description,
                    matched_user_id=request.user_id if confidence >= 0.3 else None,
                    matched_user_name=saved_data.get("user_name") if confidence >= 0.3 else None,
                    confidence=confidence
                )
        
        # 등록된 모든 얼굴과 비교
        matched_user = find_matching_user(face_description)
        
        return FaceRecognitionResponse(
            success=True,
            face_detected=True,
            face_count=face_count,
            description=face_description,
            matched_user_id=matched_user.get("user_id") if matched_user else None,
            matched_user_name=matched_user.get("user_name") if matched_user else None,
            confidence=matched_user.get("confidence") if matched_user else None
        )
        
    except Exception as e:
        logger.error(f"얼굴 인식 에러: {str(e)}")
        return FaceRecognitionResponse(
            success=False,
            face_detected=False,
            face_count=0,
            error=str(e)
        )


@app.delete("/face/{user_id}")
async def delete_face(user_id: str):
    """
    등록된 얼굴 삭제 엔드포인트
    """
    try:
        user_dir = FACE_DATA_DIR / user_id
        if not user_dir.exists():
            raise HTTPException(status_code=404, detail="등록된 얼굴을 찾을 수 없습니다.")
        
        # 디렉토리와 모든 파일 삭제
        shutil.rmtree(user_dir)
        
        logger.info(f"얼굴 데이터 삭제 완료: {user_id}")
        
        return {
            "success": True,
            "message": "얼굴 데이터가 삭제되었습니다."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"얼굴 삭제 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"얼굴 삭제 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/face/{user_id}")
async def get_face_info(user_id: str):
    """
    등록된 얼굴 정보 조회 엔드포인트
    """
    try:
        metadata = load_face_data(user_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="등록된 얼굴을 찾을 수 없습니다.")
        
        # 이미지 경로는 제외하고 메타데이터만 반환
        response = {
            "user_id": metadata.get("user_id"),
            "user_name": metadata.get("user_name"),
            "face_description": metadata.get("face_description"),
            "registered": True
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"얼굴 정보 조회 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"얼굴 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )

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
한국어로 대화하며, 존댓말을 사용합니다.

답변 형식:
- 중요한 키워드는 **굵게** 표시하세요.
- 도움을 드릴 수 있는 분야를 간단히 안내할 때는 줄바꿈으로 구분하세요."""
            else:
                system_prompt = """당신은 뉴스 플랫폼 고객센터의 친절한 AI 상담원입니다.
사용자에게 자신을 소개하고, 어떤 도움을 드릴 수 있는지 설명해주세요.
- 뉴스 플랫폼의 고객센터 AI 상담원임을 명확히 알려주세요
- 서비스 이용 관련 질문에 도움을 드릴 수 있다고 안내하세요
- 영상 제작, 게시물 작성, 프로필/계정 관리 등 서비스 이용 관련 질문을 받을 수 있다고 설명하세요
한국어로 대화하며, 존댓말을 사용합니다.

답변 형식:
- 중요한 키워드는 **굵게** 표시하세요.
- 도움 가능한 분야를 나열할 때는 각 항목을 줄바꿈으로 구분하세요."""
            
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
        
        # ===== 서비스 관련 키워드 체크 (일반 질문 필터링) =====
        # 서비스 이용과 관련된 키워드 목록
        service_keywords = [
            # 계정/인증 관련
            '로그인', '로그아웃', '회원가입', '회원 가입', '비밀번호', '비번', '계정', '아이디', 
            '인증', '본인인증', '이메일 인증', '휴대폰 인증', '탈퇴', '회원탈퇴', '회원 탈퇴',
            # 프로필 관련
            '프로필', '닉네임', '사진 변경', '프로필 사진', '자기소개', '내 정보', '정보 수정',
            # 게시물/영상 관련
            '게시물', '게시글', '글 작성', '글쓰기', '영상', '동영상', '업로드', '올리기',
            '삭제', '수정', '편집', '저장', '임시저장', '발행', '공개', '비공개',
            # 상호작용 관련
            '좋아요', '댓글', '대댓글', '답글', '공유', '북마크', '스크랩', '저장',
            # 설정 관련
            '설정', '환경설정', '알림 설정', '개인정보', '보안', '언어 설정',
            # 결제/멤버십 관련
            '결제', '구매', '환불', '멤버십', '구독권', '이용권', '포인트',
            # 고객센터 관련
            '문의', '1:1 문의', '상담', '도움말', '고객센터', 'FAQ', '자주 묻는', 
            '오류', '에러', '버그', '안됨', '안 됨', '안되요', '안 되요', '작동', '문제',
            # 서비스 기능 관련
            '검색', '필터', '정렬', '카테고리', '태그', '해시태그', '추천', '인기',
            '피드', '타임라인', '홈', '탐색', '둘러보기'
        ]
        
        # FAQ 질문에서 키워드 추출하여 추가
        faq_keywords = []
        if request.faq_data:
            for faq in request.faq_data:
                question = faq.get('question', '').lower()
                # FAQ 질문에서 주요 단어 추출 (2글자 이상)
                words = question.replace('?', '').replace('.', '').split()
                faq_keywords.extend([w for w in words if len(w) >= 2])
        
        # 서비스 관련 질문인지 확인
        all_service_keywords = service_keywords + faq_keywords
        is_service_related = any(keyword in user_message_lower for keyword in all_service_keywords)
        
        # 일반적인 질문 패턴 감지 (서비스와 무관한 질문)
        general_question_patterns = [
            '뭐야', '뭐예요', '뭔가요', '무엇인가요', '무엇이야', '알려줘', '설명해', '찾아줘',
            '어디', '언제', '왜', '어떻게', '누가', '무슨', '어떤',
            '기사', '뉴스', '날씨', '주가', '환율', '정치', '경제', '사회', '문화', '스포츠',
            '야당', '여당', '대통령', '국회', '선거', '투표',
            '비트코인', '주식', '부동산', '금리', '물가',
            '산불', '지진', '태풍', '홍수', '사고', '사건'
        ]
        
        # 일반 질문 패턴이 있고 서비스 키워드가 없으면 일반 질문으로 판단
        has_general_pattern = any(pattern in user_message_lower for pattern in general_question_patterns)
        
        if has_general_pattern and not is_service_related:
            logger.info(f"일반 질문으로 판단하여 차단: {request.message[:50]}...")
            return QaResponse(
                reply="죄송합니다. 질문하신 내용은 서비스 이용과 관련된 내용이 아니어서 답변드리기 어렵습니다. "
                      "저는 뉴스 플랫폼 고객센터 AI 상담원으로, 서비스 이용 관련 질문(계정, 게시물, 영상 업로드, 설정 등)에 대해 도움을 드리고 있습니다. "
                      "더 많은 정보를 원하신다면 오른쪽 하단의 AI 비서를 이용해 주세요. "
                      "서비스 이용 관련 추가 문의사항이 있으시면 '문의 작성'을 통해 문의해주시면 관리자가 확인 후 답변드리겠습니다."
            )
        
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
3. 서비스 이용과 무관한 일반적인 질문이면 "죄송합니다. 질문하신 내용에 대한 FAQ 정보를 찾을 수 없습니다. 서비스 이용 관련 질문만 답변해드릴 수 있습니다. 추가 문의사항이 있으시면 '문의 작성'을 통해 문의해주시면 관리자가 확인 후 답변드리겠습니다."라고 답변하세요.
4. 한국어로 대화하며, 존댓말을 사용합니다.
5. 답변은 명확하고 이해하기 쉽게 작성하세요.

답변 형식 규칙 (반드시 지켜주세요):
- 중요한 키워드, 메뉴명, 버튼명은 **굵게** 표시하세요.
- 단계별 설명은 "**1단계:** 내용", "**2단계:** 내용" 형식으로 작성하세요.
- 절대로 번호나 단계 표시 다음에 줄바꿈을 넣지 마세요. 반드시 같은 줄에 내용을 작성하세요.
- 각 단계는 줄바꿈 한 번으로 구분하세요.

답변 예시:
**영상 제작** 방법을 안내해 드리겠습니다.

**1단계:** **메인 페이지**에서 영상 제작 메뉴를 클릭하세요.
**2단계:** **제목**과 **내용**을 입력해 주세요.
**3단계:** 원하시는 **영상 스타일**을 선택하세요.
**4단계:** **제작하기** 버튼을 클릭하면 AI가 영상을 생성합니다.

추가 문의사항이 있으시면 말씀해 주세요!\n\n"""
        
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
        logger.error(f"Q&A 처리 중 오류 발생: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Q&A 처리 중 오류가 발생했습니다: {str(e)}"
        )


# ===== 환율 API 엔드포인트 =====
@app.get("/api/exchange-rate", response_model=ExchangeRateListResponse)
async def get_all_exchange_rates():
    """
    모든 환율 조회 (당일)
    """
    if exchange_rate_client is None:
        raise HTTPException(
            status_code=503,
            detail="환율 API 클라이언트를 사용할 수 없습니다."
        )
    
    try:
        logger.info("[환율] 당일 환율 조회 요청")
        rates = exchange_rate_client.get_exchange_rates()
        
        if not rates:
            logger.warning("[환율] 환율 데이터가 없습니다")
            return ExchangeRateListResponse(
                exchange_rates=[],
                count=0,
                search_date=None
            )
        
        response_list = [ExchangeRateResponse.from_exchange_rate(rate) for rate in rates]
        
        logger.info(f"[환율] 환율 조회 성공 - 개수: {len(response_list)}")
        return ExchangeRateListResponse(
            exchange_rates=response_list,
            count=len(response_list),
            search_date=None
        )
        
    except Exception as e:
        logger.error(f"[환율] 환율 조회 실패: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"환율 조회 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/api/exchange-rate/date/{search_date}", response_model=ExchangeRateListResponse)
async def get_exchange_rates_by_date(search_date: str):
    """
    특정 날짜의 환율 조회
    
    Args:
        search_date: 조회 날짜 (yyyyMMdd 형식, 예: 20260203)
    """
    if exchange_rate_client is None:
        raise HTTPException(
            status_code=503,
            detail="환율 API 클라이언트를 사용할 수 없습니다."
        )
    
    try:
        # 날짜 형식 검증
        if len(search_date) != 8 or not search_date.isdigit():
            raise HTTPException(
                status_code=400,
                detail="날짜 형식이 올바르지 않습니다. yyyyMMdd 형식이어야 합니다. (예: 20260203)"
            )
        
        logger.info(f"[환율] 특정 날짜 환율 조회 요청 - 날짜: {search_date}")
        rates = exchange_rate_client.get_exchange_rates(search_date=search_date)
        
        if not rates:
            logger.warning(f"[환율] 환율 데이터가 없습니다 - 날짜: {search_date}")
            return ExchangeRateListResponse(
                exchange_rates=[],
                count=0,
                search_date=search_date
            )
        
        response_list = [ExchangeRateResponse.from_exchange_rate(rate) for rate in rates]
        
        logger.info(f"[환율] 환율 조회 성공 - 날짜: {search_date}, 개수: {len(response_list)}")
        return ExchangeRateListResponse(
            exchange_rates=response_list,
            count=len(response_list),
            search_date=search_date
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[환율] 환율 조회 실패 - 날짜: {search_date}, 오류: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"환율 조회 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/api/exchange-rate/currency/{cur_unit}", response_model=ExchangeRateResponse)
async def get_exchange_rate_by_currency(cur_unit: str):
    """
    특정 통화의 환율 조회 (당일)
    
    Args:
        cur_unit: 통화 코드 (USD, JPY, EUR 등)
    """
    if exchange_rate_client is None:
        raise HTTPException(
            status_code=503,
            detail="환율 API 클라이언트를 사용할 수 없습니다."
        )
    
    try:
        logger.info(f"[환율] 특정 통화 환율 조회 요청 - 통화: {cur_unit}")
        rate = exchange_rate_client.get_exchange_rate_by_currency(cur_unit)
        
        if rate is None:
            logger.warning(f"[환율] 환율 정보를 찾을 수 없습니다 - 통화: {cur_unit}")
            raise HTTPException(
                status_code=404,
                detail=f"{cur_unit} 통화의 환율 정보를 찾을 수 없습니다."
            )
        
        logger.info(f"[환율] 환율 조회 성공 - 통화: {cur_unit}")
        return ExchangeRateResponse.from_exchange_rate(rate)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[환율] 환율 조회 실패 - 통화: {cur_unit}, 오류: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"환율 조회 중 오류가 발생했습니다: {str(e)}"
        )


# ===== 환율 크롤링 API 엔드포인트 =====
@app.get("/api/exchange-rate/crawl")
async def crawl_exchange_rates(search_date: Optional[str] = None):
    """
    환율 데이터 크롤링 (API 한도 초과 시 사용)
    
    Args:
        search_date: 조회 날짜 (yyyyMMdd 형식, None이면 당일)
    
    Returns:
        크롤링된 환율 데이터 리스트
    """
    if exchange_rate_crawler is None:
        raise HTTPException(
            status_code=503,
            detail="환율 크롤러를 사용할 수 없습니다."
        )
    
    try:
        logger.info(f"[크롤링] 환율 데이터 크롤링 요청 - 날짜: {search_date}")
        rates = exchange_rate_crawler.crawl_exchange_rates(search_date)
        
        if not rates:
            logger.warning(f"[크롤링] 환율 데이터를 찾을 수 없습니다 - 날짜: {search_date}")
            return {
                "exchange_rates": [],
                "count": 0,
                "search_date": search_date or datetime.now().strftime("%Y%m%d")
            }
        
        logger.info(f"[크롤링] 환율 데이터 크롤링 성공 - 날짜: {search_date}, 개수: {len(rates)}")
        return {
            "exchange_rates": rates,
            "count": len(rates),
            "search_date": search_date or datetime.now().strftime("%Y%m%d")
        }
        
    except Exception as e:
        logger.error(f"[크롤링] 환율 데이터 크롤링 실패 - 날짜: {search_date}, 오류: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"환율 크롤링 중 오류가 발생했습니다: {str(e)}"
        )


# ===== 주가지수 크롤링 API 엔드포인트 =====
@app.get("/api/stock-index/crawl")
async def crawl_stock_indices(mrkt_cls: Optional[str] = None, search_date: Optional[str] = None):
    """
    주가지수 데이터 크롤링 (API 한도 초과 시 사용)
    
    Args:
        mrkt_cls: 시장 구분 (KOSPI 또는 KOSDAQ, None이면 둘 다)
        search_date: 조회 날짜 (YYYYMMDD 형식, None이면 오늘)
    
    Returns:
        크롤링된 주가지수 데이터 리스트
    """
    if stock_index_crawler is None:
        raise HTTPException(
            status_code=503,
            detail="주가지수 크롤러를 사용할 수 없습니다."
        )
    
    try:
        logger.info(f"[크롤링] 주가지수 데이터 크롤링 요청 - 시장: {mrkt_cls or '전체'}, 날짜: {search_date or '오늘'}")
        indices = stock_index_crawler.crawl_stock_index(mrkt_cls, search_date)
        
        if not indices:
            logger.warning(f"[크롤링] 주가지수 데이터를 찾을 수 없습니다 - 시장: {mrkt_cls or '전체'}")
            return {
                "stock_indices": [],
                "count": 0
            }
        
        logger.info(f"[크롤링] 주가지수 데이터 크롤링 성공 - 시장: {mrkt_cls or '전체'}, 개수: {len(indices)}")
        return {
            "stock_indices": indices,
            "count": len(indices)
        }
        
    except Exception as e:
        logger.error(f"[크롤링] 주가지수 데이터 크롤링 실패 - 시장: {mrkt_cls or '전체'}, 오류: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"주가지수 크롤링 중 오류가 발생했습니다: {str(e)}"
        )


# ===== 서버 실행 =====
if __name__ == "__main__":
    import uvicorn
    try:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=8000, 
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        logger.info("서버가 종료되었습니다.")
    except Exception as e:
        logger.error(f"서버 실행 중 오류 발생: {str(e)}")
        raise
