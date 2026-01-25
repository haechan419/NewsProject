import apiClient from './axios';

// 로그인
export const login = async (email, password) => {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password,
  });
  return response.data;
};

// 로그아웃
export const logout = async () => {
  await apiClient.post('/api/auth/logout');
};

// 토큰 갱신
export const refreshToken = async (refreshToken) => {
  const response = await apiClient.post('/api/auth/refresh', {
    refreshToken,
  });
  return response.data;
};

// 회원가입
export const signUp = async (signUpData) => {
  const response = await apiClient.post('/api/auth/signup', signUpData);
  return response.data;
};

// 현재 사용자 정보 조회
export const getMyInfo = async () => {
  const response = await apiClient.get('/api/user/me');
  return response.data;
};
