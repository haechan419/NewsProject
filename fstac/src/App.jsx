import { lazy, Suspense } from 'react';
import AppRouter from './router/AppRouter';
import { useSelector } from 'react-redux';

// FloatingAI 컴포넌트를 lazy로 로드
const FloatingAI = lazy(() => import('./components/FloatingAI/FloatingAI'));

function App() {
  // 로그인 상태 확인 (로그인한 사용자에게만 FloatingAI 표시)
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="App">
      <AppRouter />
      {/* 로그인한 사용자에게만 FloatingAI 표시 */}
      {isAuthenticated && (
        <Suspense fallback={null}>
          <FloatingAI />
        </Suspense>
      )}
    </div>
  );
}

export default App;
