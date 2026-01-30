import apiClient from './axios';

/**
 * 메인페이지 관련 API
 */

/**
 * 메인페이지 데이터 조회
 */
export const getMainPageData = async () => {
  try {
    const response = await apiClient.get('/api/mainpage');
    return response.data;
  } catch (error) {
    console.error('메인페이지 데이터 조회 실패:', error);
    throw error;
  }
};
