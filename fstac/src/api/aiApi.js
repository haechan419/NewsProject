// aiApi.js - AI 챗봇 API 모듈
import apiClient from './axios';

/**
 * 실시간 검색어 조회
 * @returns {Promise<{keywords: Array, updated_at: string}>}
 */
export const getTrendingKeywords = async () => {
  try {
    const response = await apiClient.get('/api/ai/trending');
    return response.data.data;
  } catch (error) {
    console.error('실시간 검색어 API 에러:', error);
    throw error;
  }
};

/**
 * AI 채팅 메시지 전송 (웹 검색 기능 포함)
 * @param {string} message - 사용자 메시지
 * @param {Array} conversationHistory - 이전 대화 기록 [{role, content}, ...]
 * @returns {Promise<{
 *   reply: string,
 *   timestamp: string,
 *   searched: boolean,
 *   searchQuery?: string,
 *   sources?: Array<{title: string, url: string, snippet: string}>
 * }>}
 */
export const sendChatMessage = async (message, conversationHistory = []) => {
  try {
    const response = await apiClient.post('/api/ai/chat', {
      message,
      conversationHistory
    });

    return response.data.data;
  } catch (error) {
    console.error('AI 채팅 API 에러:', error);
    throw error;
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
