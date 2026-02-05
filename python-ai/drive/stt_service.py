"""
STT (Speech-to-Text) 서비스
OpenAI Whisper API를 사용하여 오디오를 텍스트로 변환
포맷 정규화: WebM 등 브라우저 포맷을 16kHz mono MP3로 변환 후 전송 (Whisper 인식 안정화)
"""

import os
import shutil
import subprocess
import sys
import tempfile
from typing import Optional

from .config import OpenAIConfig
from .exceptions import STTError
from .logger_config import get_logger

logger = get_logger(__name__)

# Whisper 권장: 16kHz, mono
STT_NORMALIZE_SAMPLE_RATE = 16000
STT_NORMALIZE_CHANNELS = 1


def _find_ffmpeg() -> Optional[str]:
    """PATH에서 ffmpeg 실행 파일 경로 반환 (Windows: ffmpeg.exe 포함)."""
    path = shutil.which("ffmpeg")
    if path:
        return path
    if sys.platform == "win32":
        path = shutil.which("ffmpeg.exe")
        if path:
            return path
    return None


def _normalize_audio_to_mp3(
    input_path: str, output_path: str
) -> bool:
    """
    ffmpeg으로 오디오를 16kHz mono MP3로 변환.
    성공 시 True, 실패 시 False (호출 측에서 원본 사용).
    """
    ffmpeg_path = _find_ffmpeg()
    if not ffmpeg_path:
        logger.warning(
            "[STT] ffmpeg을 찾을 수 없습니다. WebM 원본 전송 시 빈 결과가 나올 수 있습니다. "
            "ffmpeg 설치 후 PATH에 추가해 주세요."
        )
        return False
    try:
        cmd = [
            ffmpeg_path,
            "-y",
            "-i", input_path,
            "-ar", str(STT_NORMALIZE_SAMPLE_RATE),
            "-ac", str(STT_NORMALIZE_CHANNELS),
            "-f", "mp3",
            output_path,
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=30,
        )
        if result.returncode != 0 or not os.path.exists(output_path):
            stderr = (result.stderr or b"")[:400].decode("utf-8", errors="replace")
            logger.warning(
                "[STT] 포맷 정규화 실패: ffmpeg returncode=%s, stderr=%s",
                result.returncode,
                stderr,
            )
            return False
        logger.info("[STT] 포맷 정규화 완료: 16kHz mono MP3")
        return True
    except subprocess.TimeoutExpired:
        logger.warning("[STT] 포맷 정규화 타임아웃, 원본 포맷으로 진행")
        return False
    except Exception as e:
        logger.warning("[STT] 포맷 정규화 오류: %s, 원본 포맷으로 진행", e)
        return False


async def transcribe_audio(
    audio_data: bytes, 
    filename: str = "audio.webm",
    openai_config: OpenAIConfig = None
) -> Optional[str]:
    """
    오디오를 텍스트로 변환 (Whisper API)
    
    Args:
        audio_data: 오디오 바이너리 데이터
        filename: 파일명 (확장자로 포맷 인식)
        openai_config: OpenAI 설정 (의존성 주입)
    
    Returns:
        변환된 텍스트 또는 None (실패 시)
    """
    try:
        # OpenAI 클라이언트 가져오기 (의존성 주입 또는 기본값)
        if openai_config is None:
            from .config import get_openai_config
            openai_config = get_openai_config()
        
        # 파일 형식 감지 (파일 내용 기반)
        def detect_audio_format(data: bytes) -> str:
            """파일 내용의 매직 넘버로 오디오 형식 감지"""
            if len(data) < 12:
                return None  # 감지 실패
            
            # WebM: 1A 45 DF A3
            if data[:4] == b'\x1a\x45\xdf\xa3':
                return ".webm"
            # MP3: FF FB 또는 FF F3 또는 FF F2 또는 ID3
            if data[:2] == b'\xff\xfb' or data[:2] == b'\xff\xf3' or data[:2] == b'\xff\xf2':
                return ".mp3"
            if data[:3] == b'ID3':
                return ".mp3"
            # WAV: RIFF...WAVE
            if data[:4] == b'RIFF' and len(data) >= 12 and data[8:12] == b'WAVE':
                return ".wav"
            # OGG: OggS
            if data[:4] == b'OggS':
                return ".ogg"
            # FLAC: fLaC
            if data[:4] == b'fLaC':
                return ".flac"
            # M4A/MP4: ftyp로 시작하는 경우
            # ftyp 박스 구조:
            # 0-4: 박스 크기 (4 bytes)
            # 4-8: 타입 'ftyp' (4 bytes) 
            # 8-12: major brand (4 bytes) - 여기가 중요!
            # 12-16: minor version (4 bytes)
            # 16-20: compatible brands 시작
            if len(data) >= 8 and data[4:8] == b'ftyp':
                if len(data) >= 20:
                    # major brand 확인 (8-12 바이트)
                    major_brand = data[8:12]
                    # compatible brands 확인 (더 넓은 범위, 8-32 바이트)
                    header_section = data[8:32] if len(data) >= 32 else data[8:]
                    
                    # 디버깅: 브랜드 정보 로깅
                    logger.info(f"[STT] ftyp 파일 감지 - major_brand: {major_brand}, header_section: {header_section[:20]}")
                    
                    # M4A 관련 브랜드 확인
                    m4a_brands = [b'M4A ', b'M4B ', b'm4a ', b'm4b ']
                    mp4_brands = [b'mp41', b'isom', b'iso2', b'avc1', b'qt  ', b'iso5', b'iso6']
                    # 3GP 형식도 MP4 계열로 처리 (3gp4, 3gp5, 3gp6 등)
                    threegp_brands = [b'3gp4', b'3gp5', b'3gp6', b'3g2a', b'3g2b']
                    
                    # M4A 브랜드가 있으면 M4A
                    for brand in m4a_brands:
                        if brand in header_section:
                            logger.info(f"[STT] M4A 브랜드 감지: {brand}")
                            return ".m4a"
                    
                    # 3GP 브랜드가 있으면 MP4로 처리 (3GP는 MP4 계열)
                    for brand in threegp_brands:
                        if brand in header_section:
                            logger.info(f"[STT] 3GP 브랜드 감지: {brand} -> MP4로 처리")
                            return ".mp4"
                    
                    # MP4 브랜드가 있으면 MP4
                    for brand in mp4_brands:
                        if brand in header_section:
                            logger.info(f"[STT] MP4 브랜드 감지: {brand}")
                            return ".mp4"
                    
                    # major_brand를 직접 확인
                    if major_brand in m4a_brands:
                        logger.info(f"[STT] major_brand로 M4A 감지: {major_brand}")
                        return ".m4a"
                    elif major_brand in threegp_brands or major_brand in mp4_brands:
                        logger.info(f"[STT] major_brand로 MP4/3GP 감지: {major_brand}")
                        return ".mp4"
                    
                    # ftyp가 있으면 기본적으로 MP4 계열
                    logger.info(f"[STT] ftyp 감지되었지만 브랜드를 찾지 못함. major_brand: {major_brand}, MP4로 간주")
                    return ".mp4"
                else:
                    # 데이터가 부족하면 MP4로 간주
                    logger.debug("[STT] ftyp 감지되었지만 데이터 부족. MP4로 간주")
                    return ".mp4"
            
            return None  # 감지 실패
        
        # 지원되는 오디오 형식 목록
        supported_formats = ['.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.oga', '.ogg', '.wav', '.webm']
        
        # 파일명에서 확장자 추출 시도
        file_extension = None
        if filename:
            # 파일명에서 확장자 추출 (예: "한글파일명.m4a" -> ".m4a")
            # 한글 파일명도 처리 가능하도록 os.path.splitext 사용
            _, ext = os.path.splitext(filename)
            if ext:
                file_extension = ext.lower()
                logger.info(f"[STT] 파일명에서 확장자 추출: {filename} -> {file_extension}")
            else:
                logger.warning(f"[STT] 파일명에 확장자가 없음: {filename}")
        else:
            logger.warning("[STT] 파일명이 제공되지 않음")
        
        # 파일 내용으로 형식 감지
        detected_format = detect_audio_format(audio_data)
        if detected_format:
            logger.info(f"[STT] 파일 내용 기반 형식 감지: {detected_format}")
        else:
            logger.warning("[STT] 파일 내용 기반 형식 감지 실패")
        
        # 최종 확장자 결정: 파일 내용 기반 감지가 더 정확함 (파일명은 잘못될 수 있음)
        # 3GP 같은 경우 파일명이 .m4a여도 실제로는 .mp4로 처리해야 함
        if detected_format:
            # 파일 내용 기반 감지 결과를 우선 사용
            final_extension = detected_format
            if file_extension and file_extension != detected_format:
                logger.warning(f"[STT] 파일명 확장자({file_extension})와 감지 형식({detected_format}) 불일치. 감지 형식 사용: {final_extension}")
            else:
                logger.info(f"[STT] 감지 형식 사용: {final_extension}")
        elif file_extension and file_extension in supported_formats:
            # 파일 내용 감지 실패 시 파일명 확장자 사용
            final_extension = file_extension
            logger.info(f"[STT] 파일 내용 감지 실패. 파일명 확장자 사용: {final_extension}")
        else:
            # 둘 다 없으면 기본값 (webm)
            final_extension = ".webm"
            logger.warning(f"[STT] 형식 감지 실패. 기본값 사용: {final_extension}")
        
        audio_size = len(audio_data)
        logger.info(f"[STT] 최종 사용 확장자: {final_extension}, 파일명: {filename}, 파일 크기: {audio_size} bytes")
        # 녹음이 거의 안 됐을 가능성 (대략 1초 미만 WebM은 수 KB 이하일 수 있음)
        if audio_size < 8000:
            logger.warning(
                "[STT] 녹음 데이터가 매우 짧습니다(%s bytes). 마이크 권한·녹음 시간을 확인하세요.",
                audio_size,
            )
        
        # 파일의 실제 바이너리 내용 확인 (디버깅용)
        logger.info(f"[STT] 파일 시작 바이트 (hex): {audio_data[:20].hex()}")
        logger.info(f"[STT] 파일 시작 바이트 (ASCII): {audio_data[:20]}")
        
        # 임시 파일 생성 (원본 저장) — 기존과 동일
        temp_file_name = f"audio{final_extension}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=final_extension, prefix="stt_") as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
        logger.info(f"[STT] 임시 파일 경로: {temp_file_path}, 파일명: {temp_file_name}")
        
        # 포맷 정규화: 16kHz mono MP3로 변환 시도 (Whisper 인식 안정화, WebM 빈 결과 방지)
        path_to_use = temp_file_path
        name_to_use = temp_file_name
        paths_to_cleanup = [temp_file_path]
        used_normalized = False
        normalized_path = None
        if final_extension in (".webm", ".ogg", ".oga", ".mp4", ".m4a"):
            try:
                fd, normalized_path = tempfile.mkstemp(suffix=".mp3", prefix="stt_norm_")
                os.close(fd)
                if _normalize_audio_to_mp3(temp_file_path, normalized_path):
                    path_to_use = normalized_path
                    name_to_use = "audio.mp3"
                    paths_to_cleanup.append(normalized_path)
                    used_normalized = True
            except Exception as e:
                logger.debug("[STT] 정규화 경로 생성 실패, 원본 사용: %s", e)
        
        try:
            stt_prompt = (
                "오늘 내일 모레 아침 오후 시 분 보내줘 메일 배송 예약 브리핑 뉴스 "
                "관심뉴스 주요뉴스 경제 정치 다음 일시정지 재생 정지 종료"
            )
            with open(path_to_use, "rb") as audio_file:
                transcript = openai_config.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=(name_to_use, audio_file),
                    language="ko",
                    prompt=stt_prompt[:500],
                )
            text = transcript.text.strip()
            logger.info(f"[STT] 변환된 텍스트: {text}")
            if not text and not used_normalized and final_extension in (".webm", ".ogg", ".oga"):
                logger.warning(
                    "[STT] 음성이 있는데 빈 결과가 나왔습니다. 브라우저 WebM/Opus를 Whisper가 제대로 읽지 못한 경우입니다. "
                    "ffmpeg을 설치하고 PATH에 추가하면 16kHz MP3로 변환 후 전송해 빈 결과를 줄일 수 있습니다."
                )
            return text
        finally:
            for p in paths_to_cleanup:
                if p and os.path.exists(p):
                    try:
                        os.unlink(p)
                    except OSError as e:
                        logger.debug("[STT] 임시 파일 삭제 실패 %s: %s", p, e)
                
    except STTError:
        raise
    except Exception as e:
        logger.error(f"STT 변환 실패: {e}", exc_info=True)
        raise STTError(f"STT 변환 중 오류 발생: {str(e)}")
