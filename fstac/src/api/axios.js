import axios from 'axios';
import { getCsrfToken } from '../util/csrf';

// API 기본 URL 설정 (환경 변수 또는 기본값)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키를 포함하여 요청 전송
});

// 요청 인터셉터: 쿠키 기반 인증 (하이브리드 지원)
apiClient.interceptors.request.use(
  (config) => {
    // 보안: 쿠키만 사용 (localStorage에 토큰 저장하지 않음)
    // 쿠키에 토큰이 있으면 자동으로 전송됨 (withCredentials: true)
    
    // CSRF 토큰 추가 (쿠키에서 읽어서 헤더에 추가)
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 인증이 필요 없는 엔드포인트 목록
    const publicEndpoints = [
      '/api/auth/login',
      '/api/auth/signup',
      '/api/auth/find-email',
      '/api/auth/find-password',
      '/api/auth/reset-password',
    ];

    // 인증이 필요 없는 엔드포인트에서는 리다이렉트하지 않음
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      originalRequest.url?.includes(endpoint)
    );

    // 401 에러이고, 아직 재시도하지 않은 경우
    if (status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;

      try {
        // Refresh Token으로 새 Access Token 발급
        // 쿠키에 refreshToken이 있으면 자동으로 전송됨
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {}, // 쿠키 사용 시 빈 객체
          { withCredentials: true }
        );

        // 보안: 쿠키에 새 토큰이 저장되므로 localStorage는 사용하지 않음
        // 쿠키는 자동으로 전송되므로 헤더 설정 불필요
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료된 경우 로그아웃
        // 보안: localStorage에 토큰을 저장하지 않으므로 제거할 필요 없음
        localStorage.removeItem('user');
        // 쿠키는 서버에서 삭제되므로 클라이언트에서는 사용자 정보만 삭제
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
