// faceApi.js - 얼굴 인식 API 모듈
import apiClient from './axios';

//얼굴 등록
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

//얼굴 인식
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
