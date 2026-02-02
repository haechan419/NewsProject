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

    // ★ [핵심] DB에 저장된 카테고리 Key와 정확히 일치해야 합니다!
    // economy (296개), culture (30개), world (40개) 확인 완료
    const categories = [
        { path: '/politics', label: '정치' },
        { path: '/economy', label: '경제' },   // business (X) -> economy (O)
        { path: '/society', label: '사회' },   // DB에 있어서 추가함
        { path: '/culture', label: '문화' },   // entertainment -> culture
        { path: '/it', label: 'IT/과학' },
        { path: '/world', label: 'INTERNATIONAL' }, // international -> world
        { path: '/board', label: '게시판' },
    ];

    return (
        <div className={`top-bar-container ${isMainPage ? 'top-bar-overlay' : ''}`}>

            {/* 1. 왼쪽: NAVER whale 로고 박스 */}
            <div className="logo-area" onClick={() => navigate('/')}>
                <div className="logo-box">
                    <span>NAVER</span>
                    <strong>whale</strong>
                </div>
            </div>

            {/* 2. 중앙: 메뉴 리스트 (DB 키값 기준 매핑) */}
            <nav className="nav-bar">
                <ul>
                    {categories.map((cat) => (
                        <li
                            key={cat.path}
                            onClick={() => navigate(cat.path)}
                            // 현재 보고 있는 탭에 색상 표시 (선택사항)
                            className={location.pathname === cat.path ? 'active' : ''}
                        >
                            {cat.label}
                        </li>
                    ))}
                </ul>
            </nav>

            {/* 3. 오른쪽: 고객센터 - 운전대 - 유저 */}
            <div className="user-menu">
                {/* 고객센터 텍스트 */}
                <button className="text-btn" onClick={() => navigate('/support')}>
                    고객센터
                </button>

                {/* 운전대 아이콘 */}
                <button className="icon-btn" aria-label="Drive Mode">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none"></circle>
                        <path d="M12 14.5V22"></path>
                        <path d="M9.5 12H2"></path>
                        <path d="M14.5 12H22"></path>
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