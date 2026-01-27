import {lazy, Suspense} from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
    <div>로딩 중...</div>
  </div>
);

// 인증 불필요 페이지들(Lazy 로드)
const Login = lazy(() => import('../pages/Login'));
const SignUp = lazy(() => import('../pages/SignUp'));
const FindEmail = lazy(() => import('../pages/FindEmail'));
const FindPassword = lazy(() => import('../pages/FindPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));

// 보호된 페이지들 (lazy 로드)
const MainPage = lazy(() => import('../pages/MainPage'));
const ProfileEdit = lazy(() => import('../pages/ProfileEdit'));
const BoardPage = lazy(() => import('../pages/board/BoardPage'));
const BoardDetail = lazy(() => import('../pages/board/BoardDetail'));
const BoardCreate = lazy(() => import('../pages/board/BoardCreate'));
const BoardModify = lazy(() => import('../pages/board/BoardModify'));

const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      {/* 로그인 페이지 (인증 불필요) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/find-email" element={<FindEmail />} />
      <Route path="/find-password" element={<FindPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
        {/* 보호된 라우트 - 로그인 필수 */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
              <MainPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <ProfileEdit />
          </ProtectedRoute>
        }
      />
        <Route
            path="/board"
            element={
                <ProtectedRoute>
                    <BoardPage />
                </ProtectedRoute>
            }
        />
        <Route
            path="/board/create"
            element={
                <ProtectedRoute>
                    <BoardCreate />
                </ProtectedRoute>
            }
        />
        <Route
            path="/board/:id"
            element={
                <ProtectedRoute>
                    <BoardDetail />
                </ProtectedRoute>
            }
        />
        <Route
            path="/board/:id/modify"
            element={
                <ProtectedRoute>
                    <BoardModify />
                </ProtectedRoute>
            }
        />

        {/* 404 처리 - 로그인 페이지로 리다이렉트 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
};

export default AppRouter;
