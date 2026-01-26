import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { loginAsync, clearError } from '../slices/authSlice';
import '../styles/common.css';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isKakaoLoginLoading, setIsKakaoLoginLoading] = useState(false);
  const [showOAuthError, setShowOAuthError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  // 회원가입 성공 메시지 확인
  const successMessage = location.state?.message;
  
  // OAuth 에러 확인 및 URL 정리
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const oauthError = urlParams.get('error');
    
    if (oauthError) {
      // OAuth 에러 타입 저장
      setShowOAuthError(oauthError);
      // 카카오 로그인 로딩 상태 초기화
      setIsKakaoLoginLoading(false);
      // URL에서 에러 파라미터 제거 (깔끔한 URL 유지)
      window.history.replaceState({}, '', '/login');
    } else {
      setShowOAuthError(null);
    }
  }, [location]);

  // 이미 로그인된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // 유효성 검사
  const validate = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!password.trim()) {
      errors.password = '비밀번호를 입력해주세요.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 로그인 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setValidationErrors({});

    if (!validate()) {
      return;
    }

    try {
      const result = await dispatch(loginAsync({ email, password }));
      if (loginAsync.fulfilled.match(result)) {
        navigate('/');
      }
    } catch (err) {
      // 에러는 Redux에서 처리됨
    }
  };

  // OAuth 로그인 핸들러 공통 함수
  const handleOAuthLogin = (provider) => {
    // 이미 로딩 중이면 무시
    if (isKakaoLoginLoading) {
      return;
    }
    
    setIsKakaoLoginLoading(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    
    // 리다이렉트 전에 약간의 지연을 두어 중복 클릭 방지
    setTimeout(() => {
      window.location.href = `${apiBaseUrl}/oauth2/authorization/${provider}`;
    }, 100);
  };

  // 카카오 로그인 핸들러
  const handleKakaoLogin = () => handleOAuthLogin('kakao');

  // 네이버 로그인 핸들러
  const handleNaverLogin = () => handleOAuthLogin('naver');

  // 구글 로그인 핸들러
  const handleGoogleLogin = () => handleOAuthLogin('google');

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">로그인</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationErrors({ ...validationErrors, email: '' });
                dispatch(clearError());
              }}
              className={validationErrors.email ? 'error' : ''}
              placeholder="이메일을 입력하세요"
              disabled={isLoading}
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setValidationErrors({ ...validationErrors, password: '' });
                dispatch(clearError());
              }}
              className={validationErrors.password ? 'error' : ''}
              placeholder="비밀번호를 입력하세요"
              disabled={isLoading}
            />
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
          </div>

          {successMessage && (
            <div className="success-message" style={{ 
              textAlign: 'center', 
              padding: '10px', 
              backgroundColor: '#d4edda', 
              borderRadius: '6px', 
              border: '1px solid #c3e6cb',
              color: '#155724',
              marginBottom: '10px'
            }}>
              {successMessage}
            </div>
          )}
          {showOAuthError === 'oauth_rate_limit' && (
            <div className="error-message server-error" style={{ 
              marginBottom: '10px',
              padding: '12px',
              backgroundColor: '#fff3cd',
              borderRadius: '6px',
              border: '1px solid #ffc107',
              color: '#856404',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowOAuthError(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#856404',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="닫기"
              >
                ×
              </button>
              <div style={{ fontWeight: '600', marginBottom: '4px', paddingRight: '24px' }}>
                ⚠️ 카카오 API 요청 제한 초과
              </div>
              <div style={{ fontSize: '14px' }}>
                일시적으로 요청이 많아 처리할 수 없습니다. 1-2분 후 다시 시도해주세요.
              </div>
            </div>
          )}
          {showOAuthError === 'oauth_invalid' && (
            <div className="error-message server-error" style={{ 
              marginBottom: '10px',
              padding: '12px',
              backgroundColor: '#f8d7da',
              borderRadius: '6px',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowOAuthError(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#721c24',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="닫기"
              >
                ×
              </button>
              <div style={{ paddingRight: '24px' }}>
                카카오 로그인 요청이 유효하지 않습니다. 다시 시도해주세요.
              </div>
            </div>
          )}
          {showOAuthError === 'oauth_denied' && (
            <div className="error-message server-error" style={{ 
              marginBottom: '10px',
              padding: '12px',
              backgroundColor: '#f8d7da',
              borderRadius: '6px',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowOAuthError(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#721c24',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="닫기"
              >
                ×
              </button>
              <div style={{ paddingRight: '24px' }}>
                카카오 로그인이 거부되었습니다.
              </div>
            </div>
          )}
          {showOAuthError === 'oauth_failed' && (
            <div className="error-message server-error" style={{ 
              marginBottom: '10px',
              padding: '12px',
              backgroundColor: '#f8d7da',
              borderRadius: '6px',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowOAuthError(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#721c24',
                  padding: '0',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="닫기"
              >
                ×
              </button>
              <div style={{ paddingRight: '24px' }}>
                카카오 로그인에 실패했습니다. 다시 시도해주세요.
              </div>
            </div>
          )}
          {error && <div className="error-message server-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <div style={{ 
            margin: '20px 0', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '10px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
            <span style={{ color: '#666', fontSize: '14px' }}>또는</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
          </div>
          
          <button 
            type="button" 
            onClick={handleKakaoLogin}
            disabled={isKakaoLoginLoading || isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isKakaoLoginLoading ? '#ccc' : '#FEE500',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isKakaoLoginLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: isKakaoLoginLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isKakaoLoginLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(254, 229, 0, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>{isKakaoLoginLoading ? '연결 중...' : '카카오 로그인'}</span>
          </button>

          <button 
            type="button" 
            onClick={handleNaverLogin}
            disabled={isKakaoLoginLoading || isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isKakaoLoginLoading ? '#ccc' : '#03C75A',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isKakaoLoginLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: isKakaoLoginLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isKakaoLoginLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(3, 199, 90, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>{isKakaoLoginLoading ? '연결 중...' : '네이버 로그인'}</span>
          </button>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={isKakaoLoginLoading || isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isKakaoLoginLoading ? '#ccc' : '#fff',
              color: '#333',
              border: '1px solid #dadce0',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isKakaoLoginLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              opacity: isKakaoLoginLoading ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isKakaoLoginLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>{isKakaoLoginLoading ? '연결 중...' : '구글 로그인'}</span>
          </button>
        </div>

        <div className="auth-footer">
          <p>
            <Link to="/find-email">아이디 찾기</Link> | <Link to="/find-password">비밀번호 찾기</Link>
          </p>
          <p style={{ marginTop: '12px' }}>
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
