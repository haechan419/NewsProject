# main.py - AI 챗봇 FastAPI 서버
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
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
from quality_check import run_one, quality_score_and_flags

# 환경 변수 로드
load_dotenv()

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="AI Chat API",
    description="GPT-4o-mini 기반 AI 챗봇 API",
    version="1.0.0"
)

# CORS 설정 (Spring Boot에서 호출 허용)
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

# 얼굴 데이터 저장 디렉토리
FACE_DATA_DIR = Path("face_data")
FACE_DATA_DIR.mkdir(exist_ok=True)


# ===== Pydantic 모델 =====
class ConversationMessage(BaseModel):
    """대화 메시지"""
    role: str  # "user" 또는 "assistant"
    content: str


class ChatRequest(BaseModel):
    """채팅 요청"""
    message: str
    conversation_history: Optional[List[ConversationMessage]] = None


class ChatResponse(BaseModel):
    """채팅 응답"""
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


# ===== 뉴스 품질 검증 관련 모델 =====
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


# ===== 시스템 프롬프트 =====
SYSTEM_PROMPT = """당신은 친절하고 도움이 되는 AI 어시스턴트입니다.
사용자의 질문에 명확하고 간결하게 답변해주세요.
한국어로 대화합니다.
전문적이면서도 친근한 톤을 유지합니다."""

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
    """헬스 체크"""
    return {"status": "ok", "message": "AI Chat API is running"}


@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI 채팅 엔드포인트
    
    - message: 사용자 메시지
    - conversation_history: 이전 대화 기록 (선택)
    """
    logger.info(f"채팅 요청 수신: {request.message[:50]}...")
    
    try:
        # 메시지 목록 구성
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        # 이전 대화 기록 추가
        if request.conversation_history:
            for msg in request.conversation_history:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # 현재 사용자 메시지 추가
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        # OpenAI API 호출
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )
        
        # 응답 추출
        reply = response.choices[0].message.content
        
        logger.info(f"AI 응답 생성 완료: {reply[:50]}...")
        
        return ChatResponse(reply=reply)
        
    except Exception as e:
        logger.error(f"채팅 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"AI 응답 생성 중 오류가 발생했습니다: {str(e)}"
        )


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


# ===== 뉴스 품질 검증 API =====
@app.post("/news/quality-check", response_model=List[QualityCheckResponse])
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
