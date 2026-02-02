// faqApi.js - FAQ API 모듈
import apiClient from './axios';

/**
 * FAQ 카테고리 목록 조회
 */
export const getCategories = async () => {
  try {
    const response = await apiClient.get('/api/faq/categories');
    return response.data.data;
  } catch (error) {
    console.error('FAQ 카테고리 조회 에러:', error);
    throw error;
  }
};

/**
 * FAQ 목록 조회
 * @param {string} category - 카테고리 (선택)
 */
export const getFaqs = async (category = null) => {
  try {
    const params = category ? { category } : {};
    const response = await apiClient.get('/api/faq', { params });
    return response.data.data;
  } catch (error) {
    console.error('FAQ 목록 조회 에러:', error);
    throw error;
  }
};

/**
 * FAQ 상세 조회
 * @param {number} id - FAQ ID
 */
export const getFaqById = async (id) => {
  try {
    const response = await apiClient.get(`/api/faq/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('FAQ 상세 조회 에러:', error);
    throw error;
  }
};

/**
 * FAQ 검색
 * @param {string} keyword - 검색 키워드
 * @param {string} category - 카테고리 (선택)
 */
export const searchFaqs = async (keyword, category = null) => {
  try {
    const params = { keyword };
    if (category) params.category = category;
    const response = await apiClient.get('/api/faq/search', { params });
    return response.data.data;
  } catch (error) {
    console.error('FAQ 검색 에러:', error);
    throw error;
  }
};

/**
 * FAQ 버튼 클릭 (즉시 답변)
 * @param {number} id - FAQ ID
 */
export const clickFaq = async (id) => {
  try {
    const response = await apiClient.post(`/api/faq/button/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('FAQ 클릭 에러:', error);
    throw error;
  }
};

// ===== 관리자 API =====

/**
 * FAQ 생성 (관리자)
 */
export const createFaq = async (faqData) => {
  try {
    const response = await apiClient.post('/api/faq', faqData);
    return response.data.data;
  } catch (error) {
    console.error('FAQ 생성 에러:', error);
    throw error;
  }
};

/**
 * FAQ 수정 (관리자)
 */
export const updateFaq = async (id, faqData) => {
  try {
    const response = await apiClient.put(`/api/faq/${id}`, faqData);
    return response.data.data;
  } catch (error) {
    console.error('FAQ 수정 에러:', error);
    throw error;
  }
};

/**
 * FAQ 삭제 (관리자)
 */
export const deleteFaq = async (id) => {
  try {
    const response = await apiClient.delete(`/api/faq/${id}`);
    return response.data;
  } catch (error) {
    console.error('FAQ 삭제 에러:', error);
    throw error;
  }
};
