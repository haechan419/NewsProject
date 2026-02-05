/**
 * 브리핑 배송(아침 신문 메일) 예약 API
 */

const API_BASE = '/api/brief-delivery';

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const json = JSON.parse(text);
      message = json.message || text;
    } catch (_) {}
    throw new Error(message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const briefDeliveryApi = {
  /**
   * 음성 분석: 오디오 → STT → NLU → (의도 맞으면 예약 등록)
   */
  analyzeVoice: async (audioBlob, userId, filename = 'voice.webm') => {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename);
    formData.append('userId', userId);
    const response = await fetch(`${API_BASE}/analyze-voice`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * 텍스트 분석: NLU(의도·배송시간) → (의도 맞으면 예약 등록)
   */
  analyzeText: async (rawText, userId) => {
    const response = await fetch(`${API_BASE}/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText, userId }),
      credentials: 'include',
    });
    return handleResponse(response);
  },

  /**
   * 사용자별 예약 목록 조회
   */
  getSchedules: async (userId) => {
    const response = await fetch(`${API_BASE}/schedules?userId=${userId}`, {
      credentials: 'include',
    });
    return handleResponse(response);
  },
};
