// qaApi.js - Q&A 챗봇 API 모듈 (HyperCLOVA)
import apiClient from './axios';

/**
 * Q&A 메시지 전송
 * @param {string} message - 사용자 메시지
 * @param {string} sessionId - 세션 ID (선택)
 * @param {Array} conversationHistory - 이전 대화 기록 (선택)
 */
export const sendQaMessage = async (message, sessionId = null, conversationHistory = []) => {
  try {
    const response = await apiClient.post('/api/qa/message', {
      message,
      sessionId,
      conversationHistory
    });
    return response.data.data;
  } catch (error) {
    console.error('Q&A 메시지 전송 에러:', error);
    throw error;
  }
};

/**
 * Q&A 대화 히스토리 조회
 */
export const getQaHistory = async () => {
  try {
    const response = await apiClient.get('/api/qa/history');
    return response.data.data;
  } catch (error) {
    console.error('Q&A 히스토리 조회 에러:', error);
    throw error;
  }
};

/**
 * Q&A 세션별 대화 히스토리 조회
 * @param {string} sessionId - 세션 ID
 */
export const getQaHistoryBySession = async (sessionId) => {
  try {
    const response = await apiClient.get(`/api/qa/history/${sessionId}`);
    return response.data.data;
  } catch (error) {
    console.error('Q&A 세션별 히스토리 조회 에러:', error);
    throw error;
  }
};
