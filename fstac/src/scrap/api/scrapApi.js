import axios from "axios";

const API_SERVER_HOST = "http://localhost:8080";

/**
 * 스크랩 토글 (추가/해제)
 * @param {number} memberId
 * @param {string} newsId - NewsCluster.id
 * @param {Object} [options] - axios 요청 옵션
 */
export const toggleScrap = async (memberId, newsId, options = {}) => {
  const res = await axios.post(
    `${API_SERVER_HOST}/api/ai/mypage/scrap`,
    null,
    {
      params: { memberId, newsId },
      withCredentials: true,
      ...options,
    }
  );
  return res.data;
};
