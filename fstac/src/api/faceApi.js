// faceApi.js - 얼굴 인식 API 모듈
import apiClient from './axios';

/**
 * 얼굴 등록
 * @param {string} imageBase64 - Base64 인코딩된 이미지
 * @param {string} userId - 사용자 ID
 * @param {string} userName - 사용자 이름 (선택)
 * @returns {Promise}
 */
export const registerFace = async (imageBase64, userId, userName = null) => {
  try {
    const response = await apiClient.post('/api/ai/face/register', {
      imageBase64,
      userId,
      userName
    });
    
    return response.data;
  } catch (error) {
    console.error('얼굴 등록 API 에러:', error);
    throw error;
  }
};

/**
 * 얼굴 인식
 * @param {string} imageBase64 - Base64 인코딩된 이미지
 * @param {string} userId - 사용자 ID (선택, 특정 사용자와 비교할 때 사용)
 * @returns {Promise}
 */
export const recognizeFace = async (imageBase64, userId = null) => {
  try {
    const response = await apiClient.post('/api/ai/face/recognize', {
      imageBase64,
      userId
    });
    
    return response.data;
  } catch (error) {
    console.error('얼굴 인식 API 에러:', error);
    throw error;
  }
};
