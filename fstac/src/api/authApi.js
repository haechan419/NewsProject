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

// 아이디 찾기
export const findEmail = async (nickname) => {
  const response = await apiClient.post('/api/auth/find-email', {
    nickname,
  });
  return response.data;
};

// 비밀번호 찾기 (재설정 토큰 생성)
export const findPassword = async (email) => {
  const response = await apiClient.post('/api/auth/find-password', {
    email,
  });
  return response.data; // 토큰 반환
};

// 비밀번호 재설정
export const resetPassword = async (token, newPassword) => {
  await apiClient.post('/api/auth/reset-password', {
    token,
    newPassword,
  });
};

// 프로필 업데이트 (닉네임 수정)
export const updateProfile = async (nickname) => {
  const response = await apiClient.put('/api/user/profile', {
    nickname,
  });
  return response.data;
};