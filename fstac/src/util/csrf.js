// CSRF 토큰 관리 유틸리티

/**
 * 쿠키에서 CSRF 토큰 읽기
 */
export const getCsrfToken = () => {
  const name = 'XSRF-TOKEN';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

/**
 * CSRF 토큰을 헤더에 추가
 */
export const addCsrfTokenToHeaders = (headers) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRF-TOKEN'] = csrfToken;
  }
  return headers;
};
