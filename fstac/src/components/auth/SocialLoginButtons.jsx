const SocialLoginButtons = ({
  onKakaoLogin,
  onNaverLogin,
  onGoogleLogin,
  isKakaoLoginLoading,
  isLoading
}) => {
  return (
    <div className="divider-container">
      <div className="divider">
        <div className="divider-line"></div>
        <span className="divider-text">또는</span>
        <div className="divider-line"></div>
      </div>
      
      <button 
        type="button" 
        onClick={onKakaoLogin}
        disabled={isKakaoLoginLoading || isLoading}
        className={`social-button social-button-kakao ${isKakaoLoginLoading ? 'disabled' : ''}`}
      >
        <span>{isKakaoLoginLoading ? '연결 중...' : '카카오 로그인'}</span>
      </button>

      <button 
        type="button" 
        onClick={onNaverLogin}
        disabled={isKakaoLoginLoading || isLoading}
        className={`social-button social-button-naver ${isKakaoLoginLoading ? 'disabled' : ''}`}
      >
        <span>{isKakaoLoginLoading ? '연결 중...' : '네이버 로그인'}</span>
      </button>

      <button 
        type="button" 
        onClick={onGoogleLogin}
        disabled={isKakaoLoginLoading || isLoading}
        className={`social-button social-button-google ${isKakaoLoginLoading ? 'disabled' : ''}`}
      >
        <span>{isKakaoLoginLoading ? '연결 중...' : '구글 로그인'}</span>
      </button>
    </div>
  );
};

export default SocialLoginButtons;
