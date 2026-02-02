import apiClient from './axios';

/**
 * 사용자 관심 카테고리별 뉴스 API
 */

/**
 * 현재 로그인한 사용자의 관심 카테고리별 뉴스 클러스터 조회
 * @param {number} limit - 조회할 최대 개수 (기본값: 20)
 * @returns {Promise<Array>} BriefingResponseDTO 리스트
 */
export const getNewsByUserCategories = async (limit = 20) => {
    try {
        const response = await apiClient.get('/api/news/user-categories', {
            params: { limit }
        });
        return response.data;
    } catch (error) {
        console.error('사용자 관심 카테고리별 뉴스 조회 실패:', error);
        throw error;
    }
};

/**
 * 특정 카테고리로 뉴스 클러스터 조회 (GET 방식)
 * @param {string} category - 카테고리 (예: "it", "politics")
 * @param {number} limit - 조회할 최대 개수 (기본값: 20)
 * @returns {Promise<Array>} BriefingResponseDTO 리스트
 */
export const getNewsByCategory = async (category, limit = 20) => {
    try {
        const response = await apiClient.get('/api/news/user-categories/by-category', {
            params: { category, limit }
        });
        return response.data;
    } catch (error) {
        console.error('카테고리별 뉴스 조회 실패:', error);
        throw error;
    }
};
