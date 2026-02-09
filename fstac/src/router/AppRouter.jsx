import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from "react-redux"; //추가
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../layouts/Layout';

// 로딩 컴포넌트
const LoadingSpinner = () => (
    <div
        style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
        }}
    >
        <div>로딩 중...</div>
    </div>
);

// 인증 불필요 페이지들(Lazy 로드)
const Login = lazy(() => import('../pages/auth/Login'));
const SignUp = lazy(() => import('../pages/auth/SignUp'));
const FindEmail = lazy(() => import('../pages/auth/FindEmail'));
const FindPassword = lazy(() => import('../pages/auth/FindPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));

// 보호된 페이지들 (lazy 로드)
const MainPage = lazy(() => import('../pages/MainPage'));
const MyPage = lazy(() => import("../pages/mypage/MyPage")); // 마이페이지 추가
const ProfileEdit = lazy(() => import('../pages/auth/ProfileEdit'));
const BoardPage = lazy(() => import('../pages/board/BoardPage'));
const BoardDetail = lazy(() => import('../pages/board/BoardDetail'));
const BoardCreate = lazy(() => import('../pages/board/BoardCreate'));
const BoardModify = lazy(() => import('../pages/board/BoardModify'));
const SupportPage = lazy(() => import('../pages/support/SupportPage'));

// ★ [추가] 뉴스 카테고리 페이지 Lazy Load
const CategoryPage = lazy(() => import('../pages/CategoryPage'));
const NewsDetailPage = lazy(() => import('../pages/NewsDetailPage'));


const AppRouter = () => {
    // Redux에서 user 정보 가져오기
    const { user } = useSelector((state) => state.auth || {});

    return (
        <Layout>
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


                    {/* 3. MyPage 라우트 장착 */}
                    <Route
                        path="/mypage"
                        element={
                            <ProtectedRoute>
                                <MyPage memberId={user?.id || user?.memberId} />
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

                    {/* ✅ 카테고리 */}
                    <Route
                        path="/board/:id/modify"
                        element={
                            <ProtectedRoute>
                                <BoardModify />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/support"
                        element={
                            <ProtectedRoute>
                                <SupportPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/news/:id"
                        element={
                            <ProtectedRoute>
                                <NewsDetailPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* 카테고리 페이지 라우트 */}
                    <Route
                        path="/category/:category"
                        element={
                            <ProtectedRoute>
                                <CategoryPage />
                            </ProtectedRoute>
                        }
                    />



                    {/* 404 처리 - 로그인 페이지로 리다이렉트 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </Layout>
    );
};

export default AppRouter;
