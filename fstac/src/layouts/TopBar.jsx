import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAsync } from '../slices/authSlice';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 에러가 있어도 로그인 페이지로 이동
      navigate('/login');
    }
  };

  return (
    <div className="top-bar-container">
      {/* 상단: 로고 및 유저 메뉴 */}
      <div className="upper-bar">
        <div className="logo-area" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          {/* 로고 이미지가 없다면 텍스트로 대체하거나 img 태그를 넣으세요 */}
          <h1 className="logo-text">COMPACT <br/> <span className="logo-highlight">DISC</span></h1>
        </div>
        
        <div className="user-menu">
          {isAuthenticated ? (
            <>
              {user && (
                <span style={{ marginRight: '10px', color: '#333' }}>
                  {user.nickname || user.email}
                </span>
              )}
              <Link 
                to="/profile/edit"
                style={{
                  textDecoration: 'none',
                  color: '#333',
                  fontSize: '14px',
                  padding: '5px 10px',
                  fontWeight: '500'
                }}
              >
                프로필
              </Link>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '5px 10px'
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login">로그인</Link>
          )}
          <Link 
            to={isAuthenticated ? "/profile/edit" : "/login"}
            className="user-icon-link"
          >
            <div className="user-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </Link>
        </div>
      </div>

      {/* 하단: 카테고리 내비게이션 */}
      <nav className="nav-bar">
        <ul>
          <li>정치</li>
          <li>경제</li>
          <li>엔터</li>
          <li>IT/과학</li>
          <li>스포츠</li>
          <li>국제</li>
          <li onClick={() => navigate('/board')} style={{ cursor: 'pointer' }}>게시판</li>
        </ul>
      </nav>
    </div>
  );
};

export default TopBar;