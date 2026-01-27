import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import OAuthErrorMessages from './OAuthErrorMessages';

// 소셜 로그인 버튼을 lazy로 로드
const SocialLoginButtons = lazy(() => import('./SocialLoginButtons'));

// 얼굴 인식 컴포넌트를 lazy로 로드
const FaceRecognitionLogin = lazy(() => import('./FaceRecognitionLogin'));

const LoginForm = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  validationErrors,
  successMessage,
  showOAuthError,
  onOAuthErrorClose,
  error,
  isLoading,
  isKakaoLoginLoading,
  onSubmit,
  onKakaoLogin,
  onNaverLogin,
  onGoogleLogin,
  // 얼굴 인식 관련 props
  isCameraActive,
  isVideoReady,
  cameraError,
  isRecognizing,
  faceRecognitionMessage,
  autoRecognitionEnabled,
  videoRef,
  onCameraToggle,
  onFaceRecognition,
  onStopCamera,
  onAutoRecognitionToggle
}) => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">로그인</h2>
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={onEmailChange}
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
              onChange={onPasswordChange}
              className={validationErrors.password ? 'error' : ''}
              placeholder="비밀번호를 입력하세요"
              disabled={isLoading}
            />
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
          </div>

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          <OAuthErrorMessages 
            showOAuthError={showOAuthError}
            onClose={onOAuthErrorClose}
          />
          {error && <div className="error-message server-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>소셜 로그인 로딩 중...</div>}>
          <SocialLoginButtons
            onKakaoLogin={onKakaoLogin}
            onNaverLogin={onNaverLogin}
            onGoogleLogin={onGoogleLogin}
            isKakaoLoginLoading={isKakaoLoginLoading}
            isLoading={isLoading}
          />
        </Suspense>

        <Suspense fallback={<div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>얼굴 인식 기능 로딩 중...</div>}>
          <FaceRecognitionLogin
            isCameraActive={isCameraActive}
            isVideoReady={isVideoReady}
            cameraError={cameraError}
            isRecognizing={isRecognizing}
            isLoading={isLoading}
            faceRecognitionMessage={faceRecognitionMessage}
            autoRecognitionEnabled={autoRecognitionEnabled}
            videoRef={videoRef}
            onCameraToggle={onCameraToggle}
            onFaceRecognition={onFaceRecognition}
            onStopCamera={onStopCamera}
            onAutoRecognitionToggle={onAutoRecognitionToggle}
          />
        </Suspense>

        <div className="auth-footer">
          <p>
            <Link to="/find-email">아이디 찾기</Link> | <Link to="/find-password">비밀번호 찾기</Link>
          </p>
          <p>
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
