import AppRouter from './router/AppRouter';
import FloatingAI from './components/FloatingAI/FloatingAI';
import { useSelector } from 'react-redux';

function App() {
  // 로그인 상태 확인 (로그인한 사용자에게만 FloatingAI 표시)
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="App">
      <AppRouter />
      {/* 로그인한 사용자에게만 FloatingAI 표시 */}
      {isAuthenticated && <FloatingAI />}
    </div>
  );
}

export default App;
