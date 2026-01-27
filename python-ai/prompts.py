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
