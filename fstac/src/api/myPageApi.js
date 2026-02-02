import axios from "axios";

const API_SERVER_HOST = "http://localhost:8080";

export const getMyPageData = async (memberId) => {
  const res = await axios.get(`${API_SERVER_HOST}/api/ai/mypage/${memberId}`);
  return res.data;
};
