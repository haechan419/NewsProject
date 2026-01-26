import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { logoutAsync } from '../slices/authSlice';

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    navigate('/login');
  };

  // OAuth 로그인 후 프로필 수정이 필요한 경우 리다이렉트
  useEffect(() => {
    const profileEdit = searchParams.get('profile');
    if (profileEdit === 'edit' && user) {
      // URL에서 파라미터 제거
      setSearchParams({});
      // 프로필 수정 페이지로 리다이렉트
      navigate('/profile/edit', { replace: true });
    }
  }, [user, searchParams, navigate, setSearchParams]);

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>환영합니다!</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => navigate('/profile/edit')} 
            className="profile-edit-button"
            style={{
              padding: '10px 20px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5568d3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#667eea';
            }}
          >
            프로필 수정
          </button>
          <button onClick={handleLogout} className="logout-button">
            로그아웃
          </button>
        </div>
      </div>

      <div className="user-info">
        <h2>사용자 정보</h2>
        {user ? (
          <div className="user-details">
            <p>
              <strong>이메일:</strong> {user.email}
            </p>
            <p>
              <strong>닉네임:</strong> {user.nickname}
            </p>
            <p>
              <strong>제공자:</strong> {user.provider}
            </p>
            {user.roleNames && user.roleNames.length > 0 && (
              <p>
                <strong>권한:</strong> {user.roleNames.join(', ')}
              </p>
            )}
            {user.categories && user.categories.length > 0 && (
              <p>
                <strong>관심 카테고리:</strong> {user.categories.join(', ')}
              </p>
            )}
          </div>
        ) : (
          <p>사용자 정보를 불러올 수 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
