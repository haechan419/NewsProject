import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutAsync } from '../slices/authSlice';

const Home = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    navigate('/login');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>환영합니다!</h1>
        <button onClick={handleLogout} className="logout-button">
          로그아웃
        </button>
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
