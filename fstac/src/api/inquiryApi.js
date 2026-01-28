// inquiryApi.js - 문의 티켓 API 모듈
import apiClient from './axios';

/**
 * 문의 티켓 생성
 * @param {Object} inquiryData - { title, content, category }
 */
export const createInquiry = async (inquiryData) => {
  try {
    const response = await apiClient.post('/api/inquiry', inquiryData);
    return response.data.data;
  } catch (error) {
    console.error('문의 생성 에러:', error);
    throw error;
  }
};

/**
 * 내 문의 목록 조회
 */
export const getMyInquiries = async () => {
  try {
    const response = await apiClient.get('/api/inquiry');
    return response.data.data;
  } catch (error) {
    console.error('내 문의 목록 조회 에러:', error);
    throw error;
  }
};

/**
 * 문의 상세 조회
 * @param {number} id - 문의 ID
 */
export const getInquiryById = async (id) => {
  try {
    const response = await apiClient.get(`/api/inquiry/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('문의 상세 조회 에러:', error);
    throw error;
  }
};

// ===== 관리자 API =====

/**
 * 전체 문의 목록 조회 (관리자)
 */
export const getAllInquiries = async () => {
  try {
    const response = await apiClient.get('/api/inquiry/admin/all');
    return response.data.data;
  } catch (error) {
    console.error('전체 문의 목록 조회 에러:', error);
    throw error;
  }
};

/**
 * 문의 상세 조회 (관리자)
 * @param {number} id - 문의 ID
 */
export const getInquiryByIdForAdmin = async (id) => {
  try {
    const response = await apiClient.get(`/api/inquiry/admin/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('문의 상세 조회 (관리자) 에러:', error);
    throw error;
  }
};

/**
 * 문의 상태/답변 업데이트 (관리자)
 * @param {number} id - 문의 ID
 * @param {Object} updateData - { status, adminResponse }
 */
export const updateInquiry = async (id, updateData) => {
  try {
    const response = await apiClient.put(`/api/inquiry/admin/${id}`, updateData);
    return response.data.data;
  } catch (error) {
    console.error('문의 업데이트 에러:', error);
    throw error;
  }
};
