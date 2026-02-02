// boardApi.js - 게시판 API 중앙 관리

export const API_BASE_URL = 'http://localhost:8080/api';

// CSRF 토큰 가져오기 (쿠키에서 읽기)
const getCsrfToken = () => {
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

// 공통 fetch 옵션 (인증 쿠키 + CSRF 토큰 포함)
const fetchWithAuth = async (url, options = {}) => {
  const csrfToken = getCsrfToken();
  
  const headers = { ...options.headers };
  
  // CSRF 토큰 추가
  if (csrfToken) {
    headers['X-CSRF-TOKEN'] = csrfToken;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // 쿠키 전송 (JWT 인증)
      headers: headers,
    });
    
    // 401 Unauthorized 오류 시 로그인 페이지로 리다이렉트
    if (response.status === 401) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
    }
    
    return response;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_RESET')) {
      throw new Error('서버 연결에 실패했습니다. 네트워크를 확인해주세요.');
    }
    throw error;
  }
};

/**
 * 게시판 관련 API
 */
export const boardApi = {
  // 게시글 목록 조회
  getBoards: (page = 0, size = 10) => 
    fetchWithAuth(`${API_BASE_URL}/boards?page=${page}&size=${size}`),

  // 타입별 게시글 목록
  getBoardsByType: (boardType, page = 0, size = 10) => 
    fetchWithAuth(`${API_BASE_URL}/boards/type/${boardType}?page=${page}&size=${size}`),

  // 게시글 검색
  searchBoards: (keyword, page = 0, size = 10) => 
    fetchWithAuth(`${API_BASE_URL}/boards/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`),

  // 게시글 상세 조회
  getBoardDetail: (boardId) => 
    fetchWithAuth(`${API_BASE_URL}/boards/${boardId}`),

  // 게시글 생성
  createBoard: (formData) => 
    fetchWithAuth(`${API_BASE_URL}/boards`, {
      method: 'POST',
      body: formData,
      // FormData는 Content-Type 자동 설정 (multipart/form-data)
    }),

  // 게시글 수정
  updateBoard: (boardId, formData) => 
    fetchWithAuth(`${API_BASE_URL}/boards/${boardId}`, {
      method: 'PUT',
      body: formData,
      // FormData는 Content-Type 자동 설정 (multipart/form-data)
    }),

  // 게시글 삭제
  deleteBoard: (boardId) => 
    fetchWithAuth(`${API_BASE_URL}/boards/${boardId}`, {
      method: 'DELETE',
    }),

  // 좋아요 토글
  toggleLike: (boardId) => 
    fetchWithAuth(`${API_BASE_URL}/boards/${boardId}/like`, {
      method: 'POST',
    }),

  // 토론 투표
  vote: (boardId, voteData) => 
    fetchWithAuth(`${API_BASE_URL}/boards/${boardId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData),
    }),
};

/**
 * 댓글 관련 API
 */
export const commentApi = {
  // 댓글 목록 조회
  getComments: (boardId) => 
    fetchWithAuth(`${API_BASE_URL}/comments/board/${boardId}`),

  // 댓글 작성 (FormData 지원 - 파일 첨부 가능)
  createComment: (formData) => 
    fetchWithAuth(`${API_BASE_URL}/comments`, {
      method: 'POST',
      body: formData,
      // FormData는 Content-Type 자동 설정 (multipart/form-data)
    }),

  // 댓글 수정
  updateComment: (commentId, data) => 
    fetchWithAuth(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  // 댓글 삭제
  deleteComment: (commentId) => 
    fetchWithAuth(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // 댓글 좋아요
  toggleLike: (commentId) => 
    fetchWithAuth(`${API_BASE_URL}/comments/${commentId}/like`, {
      method: 'POST',
    }),
};

/**
 * 파일 관련 API
 */
export const fileApi = {
  // 파일 다운로드 URL 생성
  getDownloadUrl: (storedFileName) => 
    `${API_BASE_URL}/files/${storedFileName}`,

  // 썸네일 URL 생성
  getThumbnailUrl: (thumbnailUrl) => 
    thumbnailUrl ? `http://localhost:8080${thumbnailUrl}` : null,
};