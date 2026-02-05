"""
드라이브 모드 FastAPI 라우터
"""

from dotenv import load_dotenv
import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging
from urllib.parse import unquote

# .env 파일 로드 (모듈 import 시 한 번만 실행)
load_dotenv()

from .intent_chain import analyze_intent
from .briefing_chain import generate_briefing
from .tts_service import generate_speech, generate_playlist_speech
from .playlist_service import generate_playlist_full_text
from .stt_service import transcribe_audio
from .config import get_openai_config, OpenAIConfig
from .exceptions import DriveModeException, TTSError, STTError, IntentAnalysisError, BriefingGenerationError
from .logger_config import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/drive", tags=["drive"])


class IntentRequest(BaseModel):
    raw_text: str
    user_id: int


class IntentResponse(BaseModel):
    intent: Optional[str]
    confidence: float
    message: str


class BriefingRequest(BaseModel):
    news_list: List[Dict[str, Any]]  # is_hot이 boolean일 수 있으므로 Any로 변경


class BriefingResponse(BaseModel):
    script: str


class ProcessCommandRequest(BaseModel):
    """통합 명령 처리 요청"""
    raw_text: str
    user_id: int
    news_queue: Optional[List[Dict[str, str]]] = None  # 뉴스 큐 (선택적)


class ProcessCommandResponse(BaseModel):
    """통합 명령 처리 응답"""
    intent: Optional[str]
    confidence: float
    dj_script: Optional[str] = None
    audio_data_base64: Optional[str] = None  # base64 인코딩된 오디오
    message: str


@router.post("/analyze-intent", response_model=IntentResponse)
async def analyze_command_intent(request: IntentRequest):
    """
    복잡한 음성 명령 의도 분석 (2단계: Python LangChain)
    
    Java에서 처리하지 못한 복잡한 명령어를 GPT-4o-mini로 분석합니다.
    """
    try:
        result = await analyze_intent(request.raw_text)
        return IntentResponse(**result)
    except IntentAnalysisError as e:
        logger.error(f"명령어 분석 실패: {e.message}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"명령어 분석 실패: {e.message}")
    except Exception as e:
        logger.error(f"예상치 못한 명령어 분석 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"명령어 분석 실패: {str(e)}")


@router.post("/generate-briefing", response_model=BriefingResponse)
async def create_briefing_script(request: BriefingRequest):
    """
    뉴스 목록을 받아 DJ 스타일의 브리핑 스크립트 생성
    
    OpenAI GPT-4o-mini를 사용하여 자연스러운 브리핑을 생성합니다.
    """
    try:
        script = await generate_briefing(request.news_list)
        return BriefingResponse(script=script)
    except BriefingGenerationError as e:
        logger.error(f"브리핑 생성 실패: {e.message}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"브리핑 생성 실패: {e.message}")
    except Exception as e:
        logger.error(f"예상치 못한 브리핑 생성 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"브리핑 생성 실패: {str(e)}")


@router.get("/tts")
async def text_to_speech(
    text: str,
    voice_type: str = "nova",
    speed: float = 1.0,
    news_id: Optional[str] = None,
    openai_config: OpenAIConfig = Depends(get_openai_config)
):
    """
    텍스트를 음성으로 변환 (TTS)
    
    OpenAI TTS-1-HD API를 사용하여 텍스트를 음성으로 변환합니다.
    news_id가 제공되면 이어듣기 시 기존 파일을 직접 조회합니다.
    """
    try:
        # URL 디코딩 (Java에서 인코딩된 텍스트를 디코딩)
        # FastAPI가 자동으로 디코딩하지만, 이중 인코딩 방지를 위해 명시적으로 처리
        decoded_text = unquote(text)
        
        # 디버깅: 받은 텍스트 확인
        logger.info(f"[TTS 요청] 원본 텍스트 (인코딩됨): {text}")
        logger.info(f"[TTS 요청] 디코딩된 텍스트: {decoded_text}")
        logger.info(f"[TTS 요청] 텍스트 길이: {len(decoded_text)}")
        logger.info(f"[TTS 요청] voice_type: {voice_type}, speed: {speed}, news_id: {news_id}")
        
        # 디코딩된 텍스트로 TTS 생성 (의존성 주입된 config 사용)
        audio_data = await generate_speech(decoded_text, voice_type, speed, news_id, openai_config)
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"}
        )
    except TTSError as e:
        logger.error(f"TTS 생성 실패: {e.message}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {e.message}")
    except Exception as e:
        logger.error(f"예상치 못한 TTS 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {str(e)}")


@router.get("/tts/script")
async def text_to_speech_script(
    text: str,
    voiceType: str = "nova",
    speed: float = 1.0,
    openai_config: OpenAIConfig = Depends(get_openai_config)
):
    """
    스크립트를 음성으로 변환 (TTS) - Java 백엔드 호환용
    
    Java 백엔드에서 호출하는 /api/drive/tts/script 엔드포인트
    voiceType 파라미터명을 사용 (Java에서 camelCase 사용)
    
    OpenAI TTS-1-HD API를 사용하여 텍스트를 음성으로 변환합니다.
    """
    try:
        # URL 디코딩 (Java에서 인코딩된 텍스트를 디코딩)
        decoded_text = unquote(text)
        
        # voiceType을 voice_type으로 변환 (Java는 camelCase, Python은 snake_case)
        voice_type = voiceType
        
        # 디버깅: 받은 텍스트 확인
        logger.info(f"[TTS/script 요청] 원본 텍스트 (인코딩됨): {text}")
        logger.info(f"[TTS/script 요청] 디코딩된 텍스트: {decoded_text}")
        logger.info(f"[TTS/script 요청] 텍스트 길이: {len(decoded_text)}")
        logger.info(f"[TTS/script 요청] voiceType: {voice_type}, speed: {speed}")
        
        # 디코딩된 텍스트로 TTS 생성 (news_id 없음, 의존성 주입된 config 사용)
        audio_data = await generate_speech(decoded_text, voice_type, speed, None, openai_config)
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=briefing.mp3"}
        )
    except TTSError as e:
        logger.error(f"TTS 생성 실패: {e.message}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {e.message}")
    except Exception as e:
        logger.error(f"예상치 못한 TTS 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {str(e)}")


@router.post("/process-command", response_model=ProcessCommandResponse)
async def process_command(request: ProcessCommandRequest):
    """
    통합 명령 처리 엔드포인트
    
    텍스트 입력 → Intent 분석 → DJ 스크립트 생성 → TTS 생성
    한 번의 호출로 전체 파이프라인을 처리합니다.
    """
    try:
        # 1단계: Intent 분석
        intent_result = await analyze_intent(request.raw_text)
        intent = intent_result.get("intent")
        confidence = intent_result.get("confidence", 0.0)
        
        dj_script = None
        audio_data_base64 = None
        
        # 2단계: 단순 제어 명령은 무조건 제외 (newsQueue가 있어도 djScript 생성하지 않음)
        simple_control_commands = ["NEXT", "PREV", "PAUSE", "RESUME", "STOP", "SAVE", 
                                   "VOLUME_UP", "VOLUME_DOWN", "SPEED_UP", "SPEED_DOWN", 
                                   "REPEAT", "SKIP"]
        
        # 단순 명령은 newsQueue가 있어도 djScript 생성하지 않음
        if intent in simple_control_commands:
            return ProcessCommandResponse(
                intent=intent,
                confidence=confidence,
                dj_script=None,  # 명시적으로 None
                audio_data_base64=None,
                message=intent_result.get("message", "명령 처리 완료")
            )
        
        # 3단계: UNKNOWN 명령 처리 (명령을 이해하지 못한 경우)
        if intent == "UNKNOWN" or intent is None:
            # UNKNOWN일 때는 기본 안내 멘트만 반환 (DJ 스크립트 생성 안 함)
            # constants.py의 고정 멘트 사용
            from .constants import FIXED_MESSAGES
            return ProcessCommandResponse(
                intent="UNKNOWN",
                confidence=confidence,
                dj_script=FIXED_MESSAGES.get("command_not_understood", "일반 대화에 대해서는 해당 프로그램에서 대답해드릴 수 있는 영역이 아닙니다. 뉴스 재생 관련 명령어만 말씀해주세요."),
                audio_data_base64=None,  # 고정 멘트는 프론트엔드에서 처리
                message=intent_result.get("message", "명령을 이해하지 못했습니다")
            )
        
        # 4단계: PLAY 명령이거나 (뉴스 큐가 있고 단순 명령이 아닐 때) DJ 스크립트 생성
        # 단순 명령은 이미 위에서 return했으므로 여기서는 PLAY 또는 복잡한 명령만 처리
        if intent == "PLAY" or (intent not in simple_control_commands and request.news_queue and len(request.news_queue) > 0):
            # DJ 스크립트 생성
            if request.news_queue and len(request.news_queue) > 0:
                dj_script = await generate_briefing(request.news_queue)
            else:
                # 뉴스 큐가 없으면 기본 멘트
                dj_script = "안녕하세요, 드라이브 모드 뉴스 브리핑을 시작합니다."
            
            # 5단계: TTS 생성 (DJ 스크립트가 있을 때만)
            if dj_script:
                try:
                    audio_data = await generate_speech(dj_script, "nova", 1.0)
                    # base64 인코딩
                    import base64
                    audio_data_base64 = base64.b64encode(audio_data).decode('utf-8')
                except Exception as e:
                    logger.error(f"TTS 생성 실패: {e}")
                    # TTS 실패해도 스크립트는 반환
        
        return ProcessCommandResponse(
            intent=intent,
            confidence=confidence,
            dj_script=dj_script,
            audio_data_base64=audio_data_base64,
            message=intent_result.get("message", "명령 처리 완료")
        )
        
    except (IntentAnalysisError, BriefingGenerationError) as e:
        logger.error(f"명령 처리 실패: {e.message}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"명령 처리 실패: {e.message}")
    except Exception as e:
        logger.error(f"예상치 못한 명령 처리 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"명령 처리 실패: {str(e)}")


@router.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    user_id: int = Form(...),
    openai_config: OpenAIConfig = Depends(get_openai_config)
):
    """
    오디오를 텍스트로 변환 (STT)
    
    OpenAI Whisper API를 사용하여 오디오를 텍스트로 변환합니다.
    """
    try:
        # 오디오 데이터 읽기
        audio_data = await audio.read()
        
        logger.info(f"[STT 요청] 파일명: {audio.filename}, 크기: {len(audio_data)} bytes, user_id: {user_id}")
        
        # STT 변환 (의존성 주입된 config 사용)
        text = await transcribe_audio(audio_data, audio.filename or "audio.webm", openai_config)
        
        if text:
            return {
                "text": text,
                "user_id": user_id,
                "success": True
            }
        else:
            raise STTError("STT 변환 결과가 비어있습니다")
            
    except STTError as e:
        logger.error(f"STT 처리 실패: {e.message}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"STT 처리 실패: {e.message}")
    except Exception as e:
        logger.error(f"예상치 못한 STT 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"STT 처리 실패: {str(e)}")


class PlaylistTTSRequest(BaseModel):
    """플레이리스트 TTS 생성 요청"""
    news_list: List[Dict[str, Any]]
    history_id: int
    voice_type: str = "nova"
    speed: float = 1.0


@router.post("/tts/playlist")
async def generate_playlist_tts(
    request: PlaylistTTSRequest,
    openai_config: OpenAIConfig = Depends(get_openai_config)
):
    """
    플레이리스트 전체 TTS 생성
    
    브리핑 + 모든 뉴스 텍스트를 하나로 합쳐서 하나의 긴 TTS 생성
    historyId 기반 캐싱 사용
    """
    try:
        logger.info(f"[플레이리스트 TTS 요청] historyId={request.history_id}, 뉴스 개수={len(request.news_list)}")
        
        # 1단계: 플레이리스트 전체 텍스트 생성
        full_text = await generate_playlist_full_text(request.news_list)
        
        # 2단계: TTS 생성 (historyId 기반 캐싱)
        audio_data = await generate_playlist_speech(
            full_text,
            request.history_id,
            request.voice_type,
            request.speed,
            openai_config
        )
        
        logger.info(f"[플레이리스트 TTS 생성 완료] historyId={request.history_id}, 크기={len(audio_data)} bytes")
        
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename=playlist_{request.history_id}.mp3"}
        )
        
    except TTSError as e:
        logger.error(f"플레이리스트 TTS 생성 실패: {e.message}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"플레이리스트 TTS 생성 실패: {e.message}")
    except Exception as e:
        logger.error(f"예상치 못한 플레이리스트 TTS 오류: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"플레이리스트 TTS 생성 실패: {str(e)}")


@router.get("/tts/history/{history_id}")
async def get_history_tts(history_id: int):
    """
    히스토리 TTS 파일 조회 (캐시 파일 반환)
    
    Java/프론트에서 히스토리 재생 시 호출. static/audio/playlists/history_{id}_*.mp3 파일이
    있으면 반환하고, 없으면 404. (파일은 플레이리스트 선택 시 POST /tts/playlist로 생성됨)
    """
    try:
        from pathlib import Path
        from .tts_service import PLAYLIST_AUDIO_DIR
        
        if not PLAYLIST_AUDIO_DIR.exists():
            raise HTTPException(status_code=404, detail="TTS 파일을 찾을 수 없습니다.")
        
        pattern = f"history_{history_id}_*.mp3"
        matching_files = list(PLAYLIST_AUDIO_DIR.glob(pattern))
        
        if not matching_files:
            logger.warning(f"히스토리 TTS 파일 없음: historyId={history_id}")
            raise HTTPException(
                status_code=404,
                detail="이 플레이리스트의 오디오 파일을 찾을 수 없습니다. 플레이리스트를 다시 선택하면 생성됩니다."
            )
        
        # 첫 번째 매칭 파일 반환 (voice/speed 조합이 여러 개일 수 있음)
        cache_file = matching_files[0]
        with open(cache_file, "rb") as f:
            audio_data = f.read()
        
        logger.info(f"히스토리 TTS 조회 성공: historyId={history_id}, 파일={cache_file.name}, 크기={len(audio_data)} bytes")
        return Response(
            content=audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename=history_{history_id}.mp3"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"히스토리 TTS 조회 실패: historyId={history_id}, error={e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS 조회 실패: {str(e)}")


@router.delete("/tts/history/{history_id}")
async def delete_history_tts(history_id: int):
    """
    히스토리 TTS 파일 삭제
    
    historyId로 시작하는 모든 TTS 파일 삭제
    """
    try:
        from pathlib import Path
        from .tts_service import PLAYLIST_AUDIO_DIR
        
        # historyId로 시작하는 파일 패턴 검색
        pattern = f"history_{history_id}_*.mp3"
        matching_files = list(PLAYLIST_AUDIO_DIR.glob(pattern))
        
        deleted_count = 0
        for file in matching_files:
            try:
                file.unlink()
                deleted_count += 1
                logger.info(f"TTS 파일 삭제: {file.name}")
            except Exception as e:
                logger.error(f"TTS 파일 삭제 실패: {file.name}, error={e}")
        
        logger.info(f"히스토리 TTS 파일 삭제 완료: historyId={history_id}, 삭제된 파일 개수={deleted_count}")
        return {"deleted_count": deleted_count}
        
    except Exception as e:
        logger.error(f"히스토리 TTS 파일 삭제 실패: historyId={history_id}, error={e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"TTS 파일 삭제 실패: {str(e)}")


@router.post("/tts/cleanup/orphan")
async def cleanup_orphan_tts_files():
    """
    고아 TTS 파일 정리 (히스토리가 없는 TTS 파일)
    
    모든 히스토리 ID를 조회하고, 해당하는 TTS 파일이 아닌 파일들을 삭제
    """
    try:
        from pathlib import Path
        from .tts_service import PLAYLIST_AUDIO_DIR
        
        # Java 서버에서 모든 히스토리 ID 조회 (추후 구현)
        # 현재는 파일 시스템에서 직접 확인
        all_history_ids = set()
        
        # TODO: Java 서버 API 호출하여 모든 historyId 조회
        # 임시로 파일 시스템에서 추출
        if PLAYLIST_AUDIO_DIR.exists():
            for file in PLAYLIST_AUDIO_DIR.glob("history_*.mp3"):
                # 파일명에서 historyId 추출: history_{historyId}_{hash}_{voice}_{speed}.mp3
                parts = file.stem.split("_")
                if len(parts) >= 2 and parts[0] == "history":
                    try:
                        history_id = int(parts[1])
                        all_history_ids.add(history_id)
                    except ValueError:
                        pass
        
        # 모든 TTS 파일 검사
        deleted_count = 0
        if PLAYLIST_AUDIO_DIR.exists():
            for file in PLAYLIST_AUDIO_DIR.glob("history_*.mp3"):
                parts = file.stem.split("_")
                if len(parts) >= 2 and parts[0] == "history":
                    try:
                        history_id = int(parts[1])
                        # 히스토리 ID가 존재하지 않으면 삭제
                        # TODO: Java 서버에서 실제 히스토리 존재 여부 확인
                        # 현재는 파일만 삭제하지 않음 (안전)
                        pass
                    except ValueError:
                        pass
        
        logger.info(f"고아 TTS 파일 정리 완료: 삭제된 파일 개수={deleted_count}")
        return {"deleted_count": deleted_count}
        
    except Exception as e:
        logger.error(f"고아 TTS 파일 정리 실패: error={e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"고아 TTS 파일 정리 실패: {str(e)}")

