import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAsync } from '../slices/authSlice';
import './TopBar.css';

const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // MainPage인지 확인 (경로가 '/'인 경우)
  const isMainPage = location.pathname === '/';

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  };

  return (
    <div className={`top-bar-container ${isMainPage ? 'top-bar-overlay' : ''}`}>
      
      {/* 1. 왼쪽: NAVER whale 로고 박스 */}
      <div className="logo-area" onClick={() => navigate('/')}>
        <div className="logo-box">
          <span>NAVER</span>
          <strong>whale</strong>
        </div>
      </div>

      {/* 2. 중앙: 메뉴 리스트 */}
      <nav className="nav-bar">
        <ul>
          <li onClick={() => navigate('/politics')}>정치</li>
          <li onClick={() => navigate('/economy')}>경제</li>
          <li onClick={() => navigate('/entertainment')}>엔터</li>
          <li onClick={() => navigate('/it')}>IT/과학</li>
          <li onClick={() => navigate('/sports')}>스포츠</li>
          <li onClick={() => navigate('/international')}>국제</li>
          <li onClick={() => navigate('/board')}>게시판</li>
        </ul>
      </nav>

      {/* 3. 오른쪽: 고객센터 - 운전대 - 유저 */}
      <div className="user-menu">
        {/* 고객센터 텍스트 */}
        <button className="text-btn" onClick={() => navigate('/support')}>
          고객센터
        </button>

        {/* [요청사항] 예쁜 운전대 아이콘 (3-Spoke Wheel Style) */}
        <button className="icon-btn" aria-label="Drive Mode">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            {/* 중앙 허브 */}
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"></circle> 
            {/* 스포크 (핸들 지지대) */}
            <path d="M12 14.5V22"></path> {/* 아래쪽 */}
            <path d="M9.5 12H2"></path>   {/* 왼쪽 */}
            <path d="M14.5 12H22"></path>  {/* 오른쪽 */}
            {/* 핸들 안쪽 그립감 디테일 (옵션) */}
            <path d="M12 2v2" opacity="0.3"></path> 
          </svg>
        </button>

        {/* 유저 아이콘 */}
        <div className="user-icon-container" ref={dropdownRef}>
          <button 
            className="icon-btn" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User Menu"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              {isAuthenticated ? (
                <>
                  <div className="dropdown-item" style={{cursor: 'default', fontWeight: 500}}>
                    {user?.nickname || '사용자'}님
                  </div>
                  <Link to="/profile/edit" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>프로필 수정</Link>
                  <button className="dropdown-item" style={{color: '#e74c3c'}} onClick={handleLogout}>로그아웃</button>
                </>
              ) : (
                <Link to="/login" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>로그인</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;