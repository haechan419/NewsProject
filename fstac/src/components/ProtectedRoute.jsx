import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useSearchParams } from 'react-router-dom';
import { fetchUserInfoAsync } from '../slices/authSlice';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // OAuth 성공 후 사용자 정보 가져오기
  useEffect(() => {
    const oauthSuccess = searchParams.get('oauth');
    if (oauthSuccess === 'success') {
      // URL에서 파라미터 제거
      setSearchParams({});
      // 사용자 정보 가져오기
      dispatch(fetchUserInfoAsync());
    }
  }, [searchParams, dispatch, setSearchParams]);

  // OAuth 성공 중이거나 인증된 경우에만 접근 허용
  const oauthSuccess = searchParams.get('oauth');
  if (!isAuthenticated && oauthSuccess !== 'success') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
