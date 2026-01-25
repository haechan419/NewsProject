import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { login as loginApi, logout as logoutApi, getMyInfo } from '../api/authApi';

// 초기 상태 (쿠키 기반 인증)
// 쿠키는 JavaScript로 접근할 수 없으므로, 사용자 정보만 localStorage에 저장
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  accessToken: null, // 쿠키에 저장되므로 null
  refreshToken: null, // 쿠키에 저장되므로 null
  isLoading: false,
  error: null,
  // 쿠키에 토큰이 있는지 확인하려면 서버에 요청해야 함
  // 초기에는 사용자 정보가 있으면 인증된 것으로 간주
  isAuthenticated: !!localStorage.getItem('user'),
};

// 로그인 비동기 액션
export const loginAsync = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await loginApi(email, password);
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || '로그인에 실패했습니다.'
      );
    }
  }
);

// 로그아웃 비동기 액션
export const logoutAsync = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await logoutApi();
    return null;
  } catch (error) {
    // 서버 에러가 있어도 로컬에서 로그아웃 처리
    return null;
  }
});

// 사용자 정보 조회 비동기 액션
export const fetchUserInfoAsync = createAsyncThunk(
  'auth/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyInfo();
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || '사용자 정보를 불러오는데 실패했습니다.'
      );
    }
  }
);

// auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user } = action.payload;
      // 토큰은 쿠키에 저장되므로 상태에 저장하지 않음
      state.user = user;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(user));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    // 로그인
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        // 서버에서 토큰을 쿠키에 저장하므로 응답에 토큰이 없을 수 있음
        const { token, user } = action.payload;
        // 쿠키에서 토큰을 읽을 수 없으므로, 인증 상태만 관리
        // 토큰은 쿠키에 저장되어 자동으로 전송됨
        state.user = user;
        state.isAuthenticated = true;
        state.error = null;
        // 사용자 정보만 localStorage에 저장 (쿠키는 JavaScript로 접근 불가)
        localStorage.setItem('user', JSON.stringify(user));
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // 로그아웃
    builder
      .addCase(logoutAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('user');
      })
      .addCase(logoutAsync.rejected, (state) => {
        state.isLoading = false;
        // 에러가 있어도 로컬에서 로그아웃 처리
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem('user');
      });

    // 사용자 정보 조회
    builder
      .addCase(fetchUserInfoAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserInfoAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        localStorage.setItem('user', JSON.stringify(action.payload));
      })
      .addCase(fetchUserInfoAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
