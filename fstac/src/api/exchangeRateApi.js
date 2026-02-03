import apiClient from './axios';

/**
 * 환율 API
 */
export const exchangeRateApi = {
    /**
     * 모든 환율 조회 (당일)
     */
    getAllExchangeRates: async () => {
        const response = await apiClient.get('/api/exchange-rate');
        return response.data;
    },

    /**
     * 특정 날짜 환율 조회
     * @param {string} searchDate - yyyyMMdd 형식 (예: "20260203")
     */
    getExchangeRatesByDate: async (searchDate) => {
        const response = await apiClient.get(`/api/exchange-rate/date/${searchDate}`);
        return response.data;
    },

    /**
     * 특정 통화 환율 조회
     * @param {string} curUnit - 통화 코드 (USD, JPY 등)
     */
    getExchangeRateByCurrency: async (curUnit) => {
        const response = await apiClient.get(`/api/exchange-rate/currency/${curUnit}`);
        return response.data;
    },
};
