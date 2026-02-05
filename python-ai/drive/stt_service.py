"""
STT (Speech-to-Text) 서비스
OpenAI Whisper API를 사용하여 오디오를 텍스트로 변환
"""

from openai import OpenAI
from typing import Optional

from .config import OpenAIConfig
from .exceptions import STTError
from .logger_config import get_logger

logger = get_logger(__name__)


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
        
        # 임시 파일로 저장 (OpenAI Whisper API는 파일 객체를 요구)
        import tempfile
        import os
        
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
        
        logger.info(f"[STT] 최종 사용 확장자: {final_extension}, 파일명: {filename}, 파일 크기: {len(audio_data)} bytes")
        
        # 파일의 실제 바이너리 내용 확인 (디버깅용)
        logger.info(f"[STT] 파일 시작 바이트 (hex): {audio_data[:20].hex()}")
        logger.info(f"[STT] 파일 시작 바이트 (ASCII): {audio_data[:20]}")
        
        # 임시 파일 생성 시 파일명에 확장자가 포함되도록 함
        # OpenAI API는 파일명의 확장자로 형식을 판단함
        temp_file_name = f"audio{final_extension}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=final_extension, prefix="stt_") as temp_file:
            temp_file.write(audio_data)
            temp_file_path = temp_file.name
            logger.info(f"[STT] 임시 파일 경로: {temp_file_path}, 파일명: {temp_file_name}")
        
        try:
            # OpenAI Whisper API 호출
            # 튜플 형식 (filename, file_object)로 파일명을 명시적으로 전달
            # OpenAI API는 파일명의 확장자로 형식을 판단함
            with open(temp_file_path, "rb") as audio_file:
                transcript = openai_config.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=(temp_file_name, audio_file),  # (filename, file_object) 튜플 형식
                    language="ko"  # 한국어 명시
                )
            
            text = transcript.text.strip()
            logger.info(f"[STT] 변환된 텍스트: {text}")
            return text
            
        finally:
            # 임시 파일 정리
            import os
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except STTError:
        raise
    except Exception as e:
        logger.error(f"STT 변환 실패: {e}", exc_info=True)
        raise STTError(f"STT 변환 중 오류 발생: {str(e)}")
