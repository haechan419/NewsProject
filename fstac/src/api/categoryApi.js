import apiClient from './axios';

/**
 * 카테고리 관련 API
 */

// 카테고리 표시 이름 매핑 (영문 → 한글)
const CATEGORY_DISPLAY_NAMES = {
    'culture': '문화',
    'economy': '경제',
    'it': 'IT/과학',
    'politics': '정치',
    'society': '사회',
    'world': '국제'
};

// 카테고리 한글 → 영문 매핑 (한글 → 영문)
const CATEGORY_TO_ENGLISH = {
    '문화': 'culture',
    '경제': 'economy',
    'IT/과학': 'it',
    'IT': 'it',  // 호환성
    '정치': 'politics',
    '사회': 'society',
    '국제': 'world',
    '세계': 'world'  // 호환성
};

/**
 * 카테고리 목록 조회
 */
export const getCategories = async () => {
    try {
        const response = await apiClient.get('/api/category/list');
        return response.data;
    } catch (error) {
        console.error('카테고리 목록 조회 실패:', error);
        throw error;
    }
};

/**
 * 현재 사용자의 관심 카테고리 조회
 */
export const getMyCategories = async () => {
    try {
        const response = await apiClient.get('/api/category/my');
        return response.data;
    } catch (error) {
        console.error('관심 카테고리 조회 실패:', error);
        throw error;
    }
};

/**
 * 관심 카테고리 업데이트
 */
export const updateMyCategories = async (categories) => {
    try {
        const response = await apiClient.put('/api/category/my', { categories });
        return response.data;
    } catch (error) {
        console.error('관심 카테고리 업데이트 실패:', error);
        throw error;
    }
};

/**
 * 카테고리를 표시 이름으로 변환 (영문 → 한글)
 * @param {string} category - 영문 카테고리 (예: "it", "politics")
 * @returns {string} 한글 표시 이름 (예: "IT/과학", "정치")
 */
export const getCategoryDisplayName = (category) => {
    if (!category) return category;
    return CATEGORY_DISPLAY_NAMES[category.toLowerCase()] || category;
};

/**
 * 한글 카테고리를 영문으로 변환 (한글 → 영문)
 * @param {string} displayName - 한글 카테고리 (예: "IT/과학", "정치")
 * @returns {string} 영문 카테고리 (예: "it", "politics")
 */
export const getCategoryEnglishName = (displayName) => {
    if (!displayName) return displayName;
    return CATEGORY_TO_ENGLISH[displayName] || displayName;
};

/**
 * 카테고리 목록을 한글 표시 이름으로 변환
 * @param {Array<string>} categories - 영문 카테고리 배열
 * @returns {Array<string>} 한글 표시 이름 배열
 */
export const convertCategoriesToDisplayNames = (categories) => {
    if (!categories || !Array.isArray(categories)) return [];
    return categories.map(cat => getCategoryDisplayName(cat));
};

/**
 * 한글 카테고리 목록을 영문으로 변환
 * @param {Array<string>} displayNames - 한글 카테고리 배열
 * @returns {Array<string>} 영문 카테고리 배열
 */
export const convertDisplayNamesToCategories = (displayNames) => {
    if (!displayNames || !Array.isArray(displayNames)) return [];
    return displayNames.map(name => getCategoryEnglishName(name));
};

export { CATEGORY_DISPLAY_NAMES, CATEGORY_TO_ENGLISH };
