"""
드라이브 모드 고정 멘트 상수 정의
Anti-Redundant TTS를 위한 고정 시스템 음성 목록
"""

# 고정 멘트 목록 (정적 오디오 파일로 캐싱)
FIXED_MESSAGES = {
    # 진입 환영 멘트
    "welcome": "드라이브 모드에 오신 것을 환영합니다",
    
    # 플레이리스트 관련 멘트
    "playlist_loading": "플레이리스트를 준비하고 있습니다",
    "playlist_completed": "플레이리스트 재생을 완료했습니다",
    
    # 명령 응답 멘트
    "next_article": "다음 기사를 읽어드릴게요",
    "command_not_understood": "명령을 이해하지 못했습니다. '다음', '일시정지' 같은 명령어를 말씀해주세요.",
    "stt_failed": "음성을 인식하지 못했습니다. 더 크고 명확하게 말씀해주세요.",
    "network_error": "연결 문제가 있습니다. 잠시 후 다시 시도해주세요.",
    
    # 재생 제어 멘트
    "paused": "일시정지되었습니다",
    "resumed": "재생을 계속합니다",
    
    # 에러 메시지
    "tts_error": "음성 생성 중 오류가 발생했습니다",
    "command_error": "명령 처리 중 오류가 발생했습니다",
    
    # 추가 명령 응답 멘트
    "help": "마이크 버튼을 누르고 명령을 말해 주세요.",
    "tts_retry": "뉴스 재생에 문제가 발생했습니다. 잠시 후 다시 시도합니다.",
}

# 시나리오별 기본 멘트 매핑 (플레이리스트 방식에서는 사용하지 않음)
SCENARIO_MESSAGES = {}

def get_fixed_message_key(text: str) -> str:
    """
    텍스트가 고정 멘트인지 확인하고 키 반환
    
    Args:
        text: 확인할 텍스트
        
    Returns:
        고정 멘트 키 또는 None
    """
    # 텍스트 정규화 (공백/줄바꿈 제거)
    text_normalized = text.strip().replace("\n", " ").replace("\r", "").replace("  ", " ")
    
    for key, message in FIXED_MESSAGES.items():
        message_normalized = message.strip().replace("\n", " ").replace("\r", "").replace("  ", " ")
        if text_normalized == message_normalized:
            return key
    return None

def get_scenario_message(scenario: str) -> str:
    """
    시나리오에 해당하는 고정 멘트 반환
    
    Args:
        scenario: 시나리오 이름 (FIRST_TIME_WELCOME, RESUME_BRIEFING, NEW_BRIEFING)
        
    Returns:
        고정 멘트 텍스트 또는 None
    """
    message_key = SCENARIO_MESSAGES.get(scenario)
    if message_key:
        return FIXED_MESSAGES.get(message_key)
    return None

