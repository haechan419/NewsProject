"""
고정 멘트 MP3 파일 자동 생성 스크립트
서버 시작 시 또는 수동으로 실행하여 고정 멘트를 미리 생성합니다.
"""

import asyncio
import os
import logging
from pathlib import Path
from .tts_service import generate_speech
from .constants import FIXED_MESSAGES
from .config import get_openai_config

logger = logging.getLogger(__name__)

# 정적 오디오 파일 디렉토리
_current_file = Path(__file__)
STATIC_AUDIO_DIR = _current_file.parent / "static" / "audio"
# 고정 멘트 오디오 디렉토리 (fixed/ 폴더 사용)
FIXED_AUDIO_DIR = STATIC_AUDIO_DIR / "fixed"

# 기본 설정
DEFAULT_VOICE_TYPE = "nova"
DEFAULT_SPEED = 1.0


async def generate_all_fixed_audio():
    """모든 고정 멘트를 MP3로 생성 (fixed/ 폴더에 저장)"""
    # 디렉토리 생성
    FIXED_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    
    # 먼저 모든 파일이 존재하는지 확인
    missing_files = []
    for key in FIXED_MESSAGES.keys():
        audio_file = FIXED_AUDIO_DIR / f"{key}_{DEFAULT_VOICE_TYPE}_{DEFAULT_SPEED}.mp3"
        if not audio_file.exists():
            missing_files.append((key, FIXED_MESSAGES[key]))
    
    # 모든 파일이 존재하면 바로 종료
    if not missing_files:
        logger.info(f"고정 멘트 MP3 파일 모두 존재함 ({len(FIXED_MESSAGES)}개) - 생성 과정 스킵")
        return
    
    # 없는 파일만 생성
    logger.info(f"고정 멘트 MP3 파일 생성 시작... ({len(missing_files)}개 필요)")
    
    generated_count = 0
    
    # OpenAI 설정 가져오기
    openai_config = get_openai_config()
    
    for key, message in missing_files:
        audio_file = FIXED_AUDIO_DIR / f"{key}_{DEFAULT_VOICE_TYPE}_{DEFAULT_SPEED}.mp3"
        
        try:
            logger.info(f"생성 중: {key} - {message}")
            # openai_config 전달 (고정 멘트는 news_id 불필요하므로 None)
            audio_data = await generate_speech(message, DEFAULT_VOICE_TYPE, DEFAULT_SPEED, None, openai_config)
            
            # 파일 저장
            with open(audio_file, "wb") as f:
                f.write(audio_data)
            
            logger.info(f"생성 완료: {audio_file.name} ({len(audio_data)} bytes)")
            generated_count += 1
            
        except Exception as e:
            logger.error(f"생성 실패: {key} - {e}", exc_info=True)
    
    logger.info(f"고정 멘트 생성 완료: {generated_count}개 생성")


if __name__ == "__main__":
    # .env 파일 로드
    from dotenv import load_dotenv
    import logging
    
    load_dotenv()
    
    # 로깅 설정
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # OpenAI API 키 확인
    if not os.getenv("OPENAI_API_KEY"):
        print("오류: OPENAI_API_KEY가 설정되지 않았습니다.")
        print(".env 파일에 OPENAI_API_KEY를 설정해주세요.")
        exit(1)
    
    # 비동기 실행
    asyncio.run(generate_all_fixed_audio())
