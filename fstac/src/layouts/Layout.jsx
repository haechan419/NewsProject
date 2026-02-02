import React from 'react';
import { useLocation } from 'react-router-dom';
import TopBar from './TopBar';
import BottomBar from './BottomBar';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // 로그인 및 인증 관련 페이지에서는 TopBar와 BottomBar를 표시하지 않음
  const authPages = ['/login', '/signup', '/find-email', '/find-password', '/reset-password'];
  const isAuthPage = authPages.includes(location.pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1">
        {children}
      </main>
      <BottomBar />
    </div>
  );
};

export default Layout;

