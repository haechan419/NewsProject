/**
 * 드라이브 모드 API 클라이언트
 * 모든 API 호출을 중앙화하여 관리
 */

const API_BASE = '/api/drive';

/**
 * API 응답 처리 헬퍼
 */
async function handleResponse(response) {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    } else {
      const text = await response.text();
      throw new Error(text || `HTTP error! status: ${response.status}`);
    }
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else if (contentType && contentType.includes('audio')) {
    return response; // 오디오 응답은 그대로 반환
  } else {
    return await response.text();
  }
}

export const driveApi = {
  /**
   * 드라이브 모드 진입
   */
  enterDriveMode: async (userId) => {
    const response = await fetch(`${API_BASE}/entry/${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse(response);
  },

  /**
   * 뉴스 큐 생성
   */
  getNewsQueue: async (userId) => {
    const response = await fetch(`${API_BASE}/queue/${userId}`);
    return handleResponse(response);
  },

  /**
   * 재생 상태 동기화 (시연용 비활성화 - playback/sync 500 방지)
   */
  syncPlaybackState: async (userId, playlistId, currentTime) => {
    // 시연 영상용: 재생 바/저장 부가기능 비활성화
    // const response = await fetch(
    //   `${API_BASE}/playback/sync?userId=${userId}&playlistId=${playlistId}&currentTime=${currentTime}`,
    //   { method: 'PATCH' }
    // );
    // return handleResponse(response);
    return Promise.resolve();
  },

  /**
   * 드라이브 모드 활성화/비활성화
   */
  setDriveModeActive: async (userId, isActive) => {
    const response = await fetch(`${API_BASE}/active/${userId}?isActive=${isActive}`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },

  // 설정 관련 API 제거: 설정 기능이 비활성화되어 있음
  // getSettings, updateSettings는 더 이상 사용되지 않음

  /**
   * 히스토리 기록
   */
  recordHistory: async (userId, newsId, category, status, listenDuration, isRecommended = false, lastSentenceIdx = null) => {
    const params = {
      userId: userId.toString(),
      newsId: newsId,
      category: category,
      status: status,
      listenDuration: listenDuration.toString(),
      isRecommended: isRecommended.toString(),
    };
    
    if (lastSentenceIdx !== null && lastSentenceIdx !== undefined) {
      params.lastSentenceIdx = lastSentenceIdx.toString();
    }
    
    const response = await fetch(`${API_BASE}/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params),
    });
    return handleResponse(response);
  },

  /**
   * 히스토리 목록 조회 (userId 기준)
   */
  getHistory: async (userId) => {
    const response = await fetch(`${API_BASE}/history/user/${userId}`);
    return handleResponse(response);
  },

  /**
   * 히스토리 삭제
   */
  deleteHistory: async (historyId) => {
    const response = await fetch(`${API_BASE}/history/${historyId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  /**
   * 히스토리 상세 조회
   * @param {number} historyId
   */
  getHistoryById: async (historyId) => {
    const response = await fetch(`${API_BASE}/history/${historyId}`);
    return handleResponse(response);
  },

  /**
   * 히스토리 TTS 재생
   * @param {number} historyId
   */
  getHistoryTTS: async (historyId) => {
    const response = await fetch(`${API_BASE}/history/${historyId}/play`);
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || `히스토리 TTS 재생 실패: ${response.status}`);
      }
      throw new Error(`히스토리 TTS 재생 실패: ${response.status}`);
    }
    // 오디오 URL 반환 (Blob URL 생성)
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
  
  /**
   * 플레이리스트 히스토리 업데이트 (재생 완료 시)
   * @param {number} historyId
   * @param {string} status
   * @param {number} currentTime
   * @param {number} listenDuration
   */
  updatePlaylistHistory: async (historyId, status, currentTime, listenDuration) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (currentTime !== null && currentTime !== undefined) params.append('currentTime', currentTime.toString());
    if (listenDuration !== null && listenDuration !== undefined) params.append('listenDuration', listenDuration.toString());
    
    const response = await fetch(`${API_BASE}/history/${historyId}?${params.toString()}`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },

  /**
   * TTS 생성 (newsId 기반)
   */
  generateTTS: async (newsId, voiceType = 'nova', speed = 1.0) => {
    const url = `${API_BASE}/tts?newsId=${encodeURIComponent(newsId)}&voiceType=${voiceType}&speed=${speed}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TTS 생성 실패: ${response.status}`);
    }
    return response; // 오디오 응답은 그대로 반환
  },

  /**
   * TTS 생성 (스크립트 기반)
   */
  generateTTSScript: async (text, voiceType = 'nova', speed = 1.0) => {
    const url = `${API_BASE}/tts/script?text=${encodeURIComponent(text)}&voiceType=${voiceType}&speed=${speed}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TTS 생성 실패: ${response.status}`);
    }
    return response; // 오디오 응답은 그대로 반환
  },

  /**
   * 음성 명령 분석
   * @param {Blob} audioBlob - 녹음 또는 시연용 MP3
   * @param {number} userId
   * @param {string} [filename] - 시연용 MP3일 때 'voice.mp3', 미지정 시 'voice.webm'
   */
  analyzeVoiceCommand: async (audioBlob, userId, filename) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename || 'voice.webm');
    formData.append('userId', userId);

    const response = await fetch(`${API_BASE}/voice/analyze`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  /**
   * 플레이리스트 목록 조회
   * @param {number} userId
   */
  getPlaylists: async (userId) => {
    const response = await fetch(`${API_BASE}/playlists/${userId}`);
    return handleResponse(response);
  },

  /**
   * 플레이리스트 선택
   * @param {number} userId
   * @param {string} playlistId
   */
  selectPlaylist: async (userId, playlistId) => {
    const response = await fetch(`${API_BASE}/select-playlist?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playlistId }),
    });
    return handleResponse(response);
  },
};
