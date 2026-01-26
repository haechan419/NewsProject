import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import MainPage from '../pages/MainPage';
import BoardPage from '../pages/board/BoardPage';
import BoardDetail from '../pages/board/BoardDetail';
import BoardCreate from '../pages/board/BoardCreate';
import BoardModify from '../pages/board/BoardModify';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRouter = () => {
  return (
    <Routes>
      {/* 로그인 페이지 (인증 불필요) */}
      <Route path="/login" element={<Login />} />
      
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
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;