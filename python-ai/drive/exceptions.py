"""
드라이브 모드 커스텀 예외
"""


class DriveModeException(Exception):
    """드라이브 모드 기본 예외"""
    
    def __init__(self, message: str, error_code: str = "DRIVE_MODE_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class TTSError(DriveModeException):
    """TTS 생성 오류"""
    
    def __init__(self, message: str):
        super().__init__(message, "TTS_ERROR")


class STTError(DriveModeException):
    """STT 변환 오류"""
    
    def __init__(self, message: str):
        super().__init__(message, "STT_ERROR")


class IntentAnalysisError(DriveModeException):
    """Intent 분석 오류"""
    
    def __init__(self, message: str):
        super().__init__(message, "INTENT_ANALYSIS_ERROR")


class BriefingGenerationError(DriveModeException):
    """브리핑 생성 오류"""
    
    def __init__(self, message: str):
        super().__init__(message, "BRIEFING_GENERATION_ERROR")
