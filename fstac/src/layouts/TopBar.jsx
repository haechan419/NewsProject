import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutAsync } from "../slices/authSlice";
import "./TopBar.css";

const TopBar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      // 에러가 있어도 로그인 페이지로 이동
      navigate("/login");
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="top-bar-container">
      {/* 상단: 로고 및 유저 메뉴 */}
      <div className="upper-bar">
        <div
          className="logo-area"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          {/* 로고 이미지가 없다면 텍스트로 대체하거나 img 태그를 넣으세요 */}
          <h1 className="logo-text">
            COMPACT <br /> <span className="logo-highlight">DISC</span>
          </h1>
        </div>

<<<<<<< HEAD
      {/* 2. 중앙: 메뉴 리스트 */}
      <nav className="nav-bar">
        <ul>
          <li onClick={() => navigate('/category/politics')}>정치</li>
          <li onClick={() => navigate('/category/economy')}>경제</li>
          <li onClick={() => navigate('/category/culture')}>문화</li>
          <li onClick={() => navigate('/category/it')}>IT/과학</li>
          <li onClick={() => navigate('/category/society')}>사회</li>
          <li onClick={() => navigate('/category/world')}>국제</li>
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
        <button className="icon-btn" aria-label="Drive Mode" onClick={driveMode.openDriveMode}>
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
                  <div className="dropdown-item" style={{ cursor: 'default', fontWeight: 500 }}>
                    {user?.nickname || '사용자'}님
                  </div>
                  <Link to="/mypage" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    마이페이지
                  </Link>
                  <Link to="/profile/edit" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>프로필 수정</Link>

                  <button className="dropdown-item" style={{ color: '#e74c3c' }} onClick={handleLogout}>로그아웃</button>
                </>
              ) : (
                <Link to="/login" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>로그인</Link>
=======
        <div className="user-menu">
          {isAuthenticated ? (
            <>
              {user && (
                <span style={{ marginRight: "10px", color: "#333" }}>
                  {user.nickname || user.email}
                </span>
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
              )}
              <button
                onClick={() => navigate("/support")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#333",
                  fontSize: "14px",
                  padding: "5px 10px",
                  fontWeight: "500",
                }}
              >
                고객센터
              </button>
              <div className="user-icon-container" ref={dropdownRef}>
                <div
                  className="user-icon"
                  onClick={toggleDropdown}
                  style={{ cursor: "pointer" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                {isDropdownOpen && (
                  <div className="dropdown-menu">
                    <Link
                      to="/profile/edit"
                      className="dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      프로필 수정
                    </Link>
                    <Link
                      to="/mypage"
                      className="dropdown-item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      마이페이지
                    </Link>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">로그인</Link>
              <Link to="/login" className="user-icon-link">
                <div className="user-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </Link>
            </>
          )}
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
          <li onClick={() => navigate("/board")} style={{ cursor: "pointer" }}>
            게시판
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default TopBar;
