const OAuthErrorMessages = ({ showOAuthError, onClose }) => {
  if (!showOAuthError) return null;

  return (
    <>
      {showOAuthError === 'oauth_rate_limit' && (
        <div className="error-message server-error oauth-error-rate-limit">
          <button
            onClick={onClose}
            className="oauth-error-close-button"
            aria-label="닫기"
          >
            ×
          </button>
          <div className="oauth-error-title">
            ⚠️ 카카오 API 요청 제한 초과
          </div>
          <div className="oauth-error-message">
            일시적으로 요청이 많아 처리할 수 없습니다. 1-2분 후 다시 시도해주세요.
          </div>
        </div>
      )}
      {showOAuthError === 'oauth_invalid' && (
        <div className="error-message server-error oauth-error-default">
          <button
            onClick={onClose}
            className="oauth-error-close-button"
            aria-label="닫기"
          >
            ×
          </button>
          <div className="oauth-error-content">
            카카오 로그인 요청이 유효하지 않습니다. 다시 시도해주세요.
          </div>
        </div>
      )}
      {showOAuthError === 'oauth_denied' && (
        <div className="error-message server-error oauth-error-default">
          <button
            onClick={onClose}
            className="oauth-error-close-button"
            aria-label="닫기"
          >
            ×
          </button>
          <div className="oauth-error-content">
            카카오 로그인이 거부되었습니다.
          </div>
        </div>
      )}
      {showOAuthError === 'oauth_failed' && (
        <div className="error-message server-error oauth-error-default">
          <button
            onClick={onClose}
            className="oauth-error-close-button"
            aria-label="닫기"
          >
            ×
          </button>
          <div className="oauth-error-content">
            카카오 로그인에 실패했습니다. 다시 시도해주세요.
          </div>
        </div>
      )}
    </>
  );
};

export default OAuthErrorMessages;
