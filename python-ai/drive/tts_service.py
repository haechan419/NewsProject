"""
TTS (Text-to-Speech) 서비스
OpenAI TTS-1-HD API를 사용하여 텍스트를 음성으로 변환
Anti-Redundant TTS: 고정 멘트는 정적 파일 캐싱, 가변 멘트만 API 호출
"""

from pathlib import Path
from openai import OpenAI
import logging
import hashlib

from .constants import get_fixed_message_key, FIXED_MESSAGES
from .config import OpenAIConfig
from .exceptions import TTSError
from .logger_config import get_logger

logger = get_logger(__name__)

# 정적 오디오 파일 디렉토리 (drive 폴더 내부)
_current_file = Path(__file__)
STATIC_AUDIO_DIR = _current_file.parent / "static" / "audio"
# 고정 멘트 오디오 디렉토리
FIXED_AUDIO_DIR = STATIC_AUDIO_DIR / "fixed"
# 뉴스 오디오 캐시 디렉토리
NEWS_AUDIO_DIR = STATIC_AUDIO_DIR / "news"
# 플레이리스트 오디오 디렉토리 (historyId 기반)
PLAYLIST_AUDIO_DIR = STATIC_AUDIO_DIR / "playlists"


async def generate_speech(
    text: str, 
    voice_type: str = "nova", 
    speed: float = 1.0,
    news_id: str = None,
    openai_config: OpenAIConfig = None
) -> bytes:
    """
    텍스트를 음성으로 변환 (TTS-1-HD)
    
    고정 멘트는 정적 파일 사용, 가변 멘트는 OpenAI API 호출
    이어듣기 시 news_id로 기존 파일을 직접 조회 가능
    
    Args:
        text: 변환할 텍스트
        voice_type: 목소리 타입 (alloy, echo, fable, onyx, nova, shimmer, ash, sage, coral)
        speed: 재생 속도 (0.25 ~ 4.0)
        news_id: 뉴스 ID (이어듣기 시 기존 파일 조회용, 선택적)
    
    Returns:
        bytes: 오디오 바이너리 데이터 (mp3)
    """
    try:
        # voice_type 정규화 (DEFAULT -> nova)
        valid_voice_type = normalize_voice_type(voice_type)
        
        # 텍스트 정규화 (공백/줄바꿈 제거하여 고정 멘트 매칭 정확도 향상)
        text_normalized = text.strip().replace("\n", " ").replace("\r", "")
        
        # 1단계: 고정 멘트 확인
        fixed_message_key = get_fixed_message_key(text_normalized)
        if fixed_message_key:
            # 고정 멘트 파일 경로 생성 (fixed/ 폴더 사용)
            audio_file = FIXED_AUDIO_DIR / f"{fixed_message_key}_{valid_voice_type.lower()}_{speed}.mp3"
            
            # 정적 파일이 있으면 반환
            if audio_file.exists():
                logger.info(f"고정 멘트 오디오 파일 사용: {audio_file.name}")
                with open(audio_file, "rb") as f:
                    return f.read()
            
            # 정적 파일이 없으면 생성 후 저장 (최초 1회)
            logger.info(f"고정 멘트 오디오 파일 생성 중: {audio_file.name}")
            audio_data = await _generate_with_openai(text_normalized, valid_voice_type, speed, openai_config)
            
            # 디렉토리 생성
            audio_file.parent.mkdir(parents=True, exist_ok=True)
            
            # 파일 저장
            with open(audio_file, "wb") as f:
                f.write(audio_data)
            
            logger.info(f"고정 멘트 오디오 파일 저장 완료: {audio_file.name}")
            return audio_data
        
        # 2단계: 가변 멘트 - 뉴스 오디오 캐싱
        # 이어듣기 시 news_id로 기존 파일 먼저 조회
        if news_id:
            # news_id 기반 파일 패턴 검색 (news_id_{text_hash}_{voice}_{speed}.mp3)
            # 또는 news_id만으로 시작하는 파일 검색
            news_id_pattern = f"{news_id}_*_{valid_voice_type.lower()}_{speed}.mp3"
            matching_files = list(NEWS_AUDIO_DIR.glob(news_id_pattern))
            
            if matching_files:
                # 가장 최근 파일 사용 (같은 newsId에 여러 버전이 있을 수 있음)
                cache_file = max(matching_files, key=lambda p: p.stat().st_mtime)
                logger.info(f"뉴스 오디오 캐시 사용 (newsId 기반): {cache_file.name}")
                with open(cache_file, "rb") as f:
                    return f.read()
            else:
                logger.info(f"newsId({news_id})로 기존 파일을 찾지 못함. 새로 생성합니다.")
        
        # 3단계: 텍스트 해시 기반 캐싱 (일반적인 경우)
        # 텍스트 해시 생성 (같은 텍스트면 같은 파일명)
        text_hash = hashlib.md5(text_normalized.encode('utf-8')).hexdigest()[:16]
        
        # news_id가 있으면 파일명에 포함, 없으면 해시만 사용
        if news_id:
            cache_file = NEWS_AUDIO_DIR / f"{news_id}_{text_hash}_{valid_voice_type.lower()}_{speed}.mp3"
        else:
            cache_file = NEWS_AUDIO_DIR / f"{text_hash}_{valid_voice_type.lower()}_{speed}.mp3"
        
        # 캐시 파일이 있으면 반환
        if cache_file.exists():
            logger.info(f"뉴스 오디오 캐시 사용: {cache_file.name}")
            with open(cache_file, "rb") as f:
                return f.read()
        
        # 캐시가 없으면 생성 후 저장
        logger.info(f"뉴스 오디오 생성 중 (캐시 저장): {cache_file.name}")
        audio_data = await _generate_with_openai(text_normalized, valid_voice_type, speed, openai_config)
        
        # 디렉토리 생성
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        
        # 파일 저장
        with open(cache_file, "wb") as f:
            f.write(audio_data)
        
        logger.info(f"뉴스 오디오 캐시 저장 완료: {cache_file.name} ({len(audio_data)} bytes)")
        return audio_data
        
    except TTSError:
        raise
    except Exception as e:
        logger.error(f"TTS 생성 실패: {e}", exc_info=True)
        raise TTSError(f"TTS 생성 중 오류 발생: {str(e)}")


def normalize_voice_type(voice_type: str) -> str:
    """
    voice_type을 OpenAI API가 인식하는 유효한 값으로 정규화
    
    Args:
        voice_type: 원본 voice_type
        
    Returns:
        유효한 voice_type (nova, shimmer, echo, onyx, fable, alloy, ash, sage, coral)
    """
    if not voice_type or voice_type.strip().lower() in ["default", ""]:
        return "nova"
    
    # OpenAI API 유효한 voice 타입 목록
    valid_voices = ["nova", "shimmer", "echo", "onyx", "fable", "alloy", "ash", "sage", "coral"]
    voice_lower = voice_type.lower().strip()
    
    if voice_lower in valid_voices:
        return voice_lower
    
    # 유효하지 않은 값이면 기본값 반환
    logger.warning(f"유효하지 않은 voice_type: {voice_type}, 기본값 'nova' 사용")
    return "nova"


async def _generate_with_openai(
    text: str, 
    voice_type: str, 
    speed: float,
    openai_config: OpenAIConfig = None
) -> bytes:
    """
    OpenAI API로 TTS 생성 (내부 함수)
    
    Args:
        text: 변환할 텍스트
        voice_type: 목소리 타입 (이미 정규화됨)
        speed: 재생 속도
        
    Returns:
        bytes: 오디오 바이너리 데이터 (mp3)
    """
    # 텍스트 최종 정리 (연속 공백 제거, 앞뒤 공백 제거)
    cleaned_text = " ".join(text.split())
    
    # TTS 품질 개선: 짧은 텍스트에 대한 처리
    # OpenAI TTS는 짧은 텍스트에서 자연스럽지 않을 수 있으므로 구두점 확인 및 정규화
    if len(cleaned_text) < 50:
        # 문장 끝에 구두점이 없으면 마침표 추가 (자연스러운 발음)
        if cleaned_text and cleaned_text[-1] not in ['.', '!', '?', '。', '！', '？']:
            cleaned_text = cleaned_text + "."
        # 짧은 텍스트는 문장 끝에 약간의 공백 추가로 자연스러움 향상
        cleaned_text = cleaned_text.strip()
    
    # 디버깅: OpenAI에 전달되는 최종 텍스트 확인
    logger.info(f"[OpenAI TTS] 전달할 텍스트: {repr(cleaned_text)}")
    logger.info(f"[OpenAI TTS] 텍스트 길이: {len(cleaned_text)}")
    logger.info(f"[OpenAI TTS] voice: {voice_type}, speed: {speed}")
    
    # OpenAI 클라이언트 가져오기 (의존성 주입 또는 기본값)
    if openai_config is None:
        from .config import get_openai_config
        openai_config = get_openai_config()
    
    try:
        response = openai_config.client.audio.speech.create(
            model="tts-1-hd",
            voice=voice_type.lower(),
            input=cleaned_text,
            speed=max(0.25, min(4.0, speed))  # 속도 제한
        )
        
        logger.info(f"[OpenAI TTS] 오디오 생성 완료, 크기: {len(response.content)} bytes")
        return response.content
    except Exception as e:
        # OpenAI API 예외 상세 로깅
        error_type = type(e).__name__
        error_message = str(e)
        logger.error(f"[OpenAI TTS] API 호출 실패: {error_type}: {error_message}", exc_info=True)
        
        # OpenAI API 특정 에러 타입 확인
        if "authentication" in error_message.lower() or "api key" in error_message.lower() or "401" in error_message:
            raise TTSError(f"OpenAI API 인증 실패: API 키를 확인해주세요. ({error_message})")
        elif "rate limit" in error_message.lower() or "429" in error_message:
            raise TTSError(f"OpenAI API 할당량 초과: 잠시 후 다시 시도해주세요. ({error_message})")
        elif "timeout" in error_message.lower():
            raise TTSError(f"OpenAI API 타임아웃: 네트워크 연결을 확인해주세요. ({error_message})")
        else:
            raise TTSError(f"OpenAI API 호출 실패: {error_message}")


async def generate_playlist_speech(
    text: str,
    history_id: int,
    voice_type: str = "nova",
    speed: float = 1.0,
    openai_config: OpenAIConfig = None
) -> bytes:
    """
    플레이리스트 전체 TTS 생성 (historyId 기반 캐싱)
    
    Args:
        text: 플레이리스트 전체 텍스트 (브리핑 + 모든 뉴스)
        history_id: 히스토리 ID (캐싱 키)
        voice_type: 목소리 타입
        speed: 재생 속도
    
    Returns:
        bytes: 오디오 바이너리 데이터 (mp3)
    """
    try:
        valid_voice_type = normalize_voice_type(voice_type)
        
        # historyId 기반 파일 경로 생성
        cache_file = PLAYLIST_AUDIO_DIR / f"history_{history_id}_{valid_voice_type.lower()}_{speed}.mp3"
        
        # 캐시 파일이 있으면 반환
        if cache_file.exists():
            logger.info(f"플레이리스트 오디오 캐시 사용: {cache_file.name}")
            with open(cache_file, "rb") as f:
                return f.read()
        
        # 캐시가 없으면 생성 후 저장
        logger.info(f"플레이리스트 오디오 생성 중 (캐시 저장): {cache_file.name}")
        audio_data = await _generate_with_openai(text, valid_voice_type, speed, openai_config)
        
        # 디렉토리 생성
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        
        # 파일 저장
        with open(cache_file, "wb") as f:
            f.write(audio_data)
        
        logger.info(f"플레이리스트 오디오 캐시 저장 완료: {cache_file.name} ({len(audio_data)} bytes)")
        return audio_data
        
    except TTSError:
        raise
    except Exception as e:
        logger.error(f"플레이리스트 TTS 생성 실패: {e}", exc_info=True)
        raise TTSError(f"플레이리스트 TTS 생성 중 오류 발생: {str(e)}")

