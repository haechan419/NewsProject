import apiClient from './axios';

/**
 * 주가지수 API
 */
export const stockIndexApi = {
    /**
     * 모든 주가지수 조회 (당일)
     */
    getAllStockIndices: async () => {
        const response = await apiClient.get('/api/stock-index');
        return response.data;
    },

    /**
     * 특정 날짜 주가지수 조회
     * @param {string} searchDate - yyyy-MM-dd 형식 (예: "2024-02-03")
     */
    getStockIndicesByDate: async (searchDate) => {
        const response = await apiClient.get('/api/stock-index', {
            params: { searchDate }
        });
        return response.data;
    },

    /**
     * 특정 시장 주가지수 조회
     * @param {string} mrktCls - 시장 구분 (KOSPI 또는 KOSDAQ)
     * @param {string} searchDate - yyyy-MM-dd 형식 (선택)
     */
    getStockIndexByMarket: async (mrktCls, searchDate = null) => {
        const params = searchDate ? { searchDate } : {};
        const response = await apiClient.get(`/api/stock-index/${mrktCls}`, { params });
        return response.data;
    },

    /**
     * 주가지수 데이터 수동 수집 (API/크롤링으로 실시간 데이터 가져오기)
     * @param {string} searchDate - yyyy-MM-dd 형식 (선택, 기본값: 오늘)
     */
    fetchStockIndices: async (searchDate = null) => {
        const params = searchDate ? { searchDate } : {};
        const response = await apiClient.post('/api/stock-index/fetch', null, { params });
        return response.data;
    },
};
