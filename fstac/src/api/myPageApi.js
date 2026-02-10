import axios from "axios";

const API_SERVER_HOST = "http://localhost:8080";

export const getMyPageData = async (memberId) => {
<<<<<<< HEAD
  const res = await axios.get(`${API_SERVER_HOST}/api/ai/mypage/${memberId}`, {
    withCredentials: true,
  });
=======
  const res = await axios.get(`${API_SERVER_HOST}/api/ai/mypage/${memberId}`);
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
  return res.data;
};
