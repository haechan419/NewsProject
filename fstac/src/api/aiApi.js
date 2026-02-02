// aiApi.js - AI 챗봇 API 모듈
import apiClient from './axios';

/**
 * AI 채팅 메시지 전송
 * @param {string} message - 사용자 메시지
 * @param {Array} conversationHistory - 이전 대화 기록 [{role, content}, ...]
 * @returns {Promise<{reply: string, timestamp: string}>}
 */
export const sendChatMessage = async (message, conversationHistory = []) => {
  try {
    const response = await apiClient.post('/api/ai/chat', {
      message,
      conversationHistory
    });

    return response.data.data;
  } catch (error) {
    // 상세한 에러 정보 로깅
    console.error('=== AI 채팅 API 에러 상세 정보 ===');
    console.error('전체 에러 객체:', error);
    console.error('에러 응답 데이터:', error.response?.data);
    console.error('에러 상태 코드:', error.response?.status);
    console.error('에러 메시지:', error.response?.data?.error || error.message);
    console.error('에러 스택:', error.stack);
    if (error.response?.data) {
      console.error('서버 응답 전체:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('================================');

    // 사용자 친화적인 에러 메시지 생성
    let errorMessage = 'AI 서버와 통신 중 오류가 발생했습니다.';
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.status === 500) {
      errorMessage = '서버 내부 오류가 발생했습니다. Python AI 서버가 실행 중인지 확인해주세요.';
    } else if (error.response?.status === 401) {
      errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    // 에러 객체에 사용자 친화적인 메시지 추가
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;

    throw enhancedError;
  }
};

/**
 * 대화 기록 초기화 (필요시 사용)
 * @returns {Promise}
 */
export const clearConversation = async () => {
  try {
    const response = await apiClient.post('/api/ai/clear');
    return response.data;
  } catch (error) {
    console.error('대화 초기화 에러:', error);
    throw error;
  }
};
