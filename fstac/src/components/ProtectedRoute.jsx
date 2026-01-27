import { useSelector } from 'react-redux';
import { Navigate, useSearchParams } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();

  // OAuth 성공 중이거나 인증된 경우에만 접근 허용
  // OAuth 처리는 Login.jsx에서 담당하므로 여기서는 인증 상태만 확인
  const oauthSuccess = searchParams.get('oauth');
  if (!isAuthenticated && oauthSuccess !== 'success') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
