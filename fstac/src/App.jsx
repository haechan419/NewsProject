import { lazy, Suspense, createContext, useState, useCallback } from 'react';
import AppRouter from './router/AppRouter';
import { useSelector } from 'react-redux';

// FloatingAI 컴포넌트를 lazy로 로드
const FloatingAI = lazy(() => import('./components/FloatingAI/FloatingAI'));
// 드라이브 모드 페이지를 lazy로 로드
const DriveModePage = lazy(() => import('./drive/DriveModePage'));

// 드라이브 모드 컨텍스트 생성
export const DriveModeContext = createContext({
  isDriveModeOpen: false,
  openDriveMode: () => {},
  closeDriveMode: () => {},
});

function App() {
  // 로그인 상태 확인 (로그인한 사용자에게만 FloatingAI 표시)
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // 드라이브 모드 상태 관리
  const [isDriveModeOpen, setIsDriveModeOpen] = useState(false);

  const openDriveMode = useCallback(() => {
    setIsDriveModeOpen(true);
  }, []);

  const closeDriveMode = useCallback(() => {
    setIsDriveModeOpen(false);
  }, []);

  return (
    <DriveModeContext.Provider value={{ isDriveModeOpen, openDriveMode, closeDriveMode }}>
      <div className="App">
        <AppRouter />
        {/* 로그인한 사용자에게만 FloatingAI 표시 */}
        {isAuthenticated && (
          <Suspense fallback={null}>
            <FloatingAI />
          </Suspense>
        )}
        {/* 드라이브 모드 오버레이 */}
        {isDriveModeOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.9)'
          }}>
            <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', marginTop: '50vh' }}>로딩 중...</div>}>
              <DriveModePage userId={user?.id ?? 1} onClose={closeDriveMode} />
            </Suspense>
          </div>
        )}
      </div>
    </DriveModeContext.Provider>
  );
}

export default App;
