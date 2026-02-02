import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../layouts/Layout';

// 로딩 컴포넌트
const LoadingSpinner = () => (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
        <div>로딩 중...</div>
    </div>
);

// 인증 불필요 페이지들
const Login = lazy(() => import('../pages/Login'));
const SignUp = lazy(() => import('../pages/SignUp'));
const FindEmail = lazy(() => import('../pages/FindEmail'));
const FindPassword = lazy(() => import('../pages/FindPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));

// 보호된 페이지들
const MainPage = lazy(() => import('../pages/MainPage'));
const ProfileEdit = lazy(() => import('../pages/ProfileEdit'));
const BoardPage = lazy(() => import('../pages/board/BoardPage'));
const BoardDetail = lazy(() => import('../pages/board/BoardDetail'));
const BoardCreate = lazy(() => import('../pages/board/BoardCreate'));
const BoardModify = lazy(() => import('../pages/board/BoardModify'));
const SupportPage = lazy(() => import('../pages/support/SupportPage'));

// ★ [추가] 뉴스 카테고리 페이지 Lazy Load
const CategoryPage = lazy(() => import('../pages/CategoryPage'));
const NewsDetailPage = lazy(() => import('../pages/NewsDetailPage'));


const AppRouter = () => {
    return (
        <Layout>
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    {/* 1. 인증 불필요 (로그인, 회원가입 등) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/find-email" element={<FindEmail />} />
                    <Route path="/find-password" element={<FindPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* 2. 로그인 필수 페이지들 (ProtectedRoute 내부) */}
                    <Route path="/" element={<ProtectedRoute><MainPage /></ProtectedRoute>} />
                    <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />

                    <Route path="/board" element={<ProtectedRoute><BoardPage /></ProtectedRoute>} />
                    <Route path="/board/create" element={<ProtectedRoute><BoardCreate /></ProtectedRoute>} />
                    <Route path="/board/:id" element={<ProtectedRoute><BoardDetail /></ProtectedRoute>} />
                    <Route path="/board/:id/modify" element={<ProtectedRoute><BoardModify /></ProtectedRoute>} />

                    <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />

                    {/* ★ [핵심] 뉴스 카테고리 페이지도 로그인해야 볼 수 있음 */}
                    {/* ✅ 상세 먼저 */}
                    <Route
                        path="/news/:id"
                        element={
                            <ProtectedRoute>
                                <NewsDetailPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* ✅ 카테고리 */}
                    <Route
                        path="/:category"
                        element={
                            <ProtectedRoute>
                                <CategoryPage />
                            </ProtectedRoute>
                        }
                    />


                    {/* 3. 404 처리 (메인으로 리다이렉트) */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </Layout>
    );
};

export default AppRouter;