import { Link } from 'react-router-dom';

const FindEmailForm = ({
  nickname,
  onNicknameChange,
  validationError,
  error,
  successMessage,
  isLoading,
  onSubmit
}) => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">아이디 찾기</h2>
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={onNicknameChange}
              className={validationError ? 'error' : ''}
              placeholder="닉네임을 입력하세요"
              disabled={isLoading}
            />
            {validationError && (
              <span className="error-message">{validationError}</span>
            )}
          </div>

          {error && <div className="error-message server-error">{error}</div>}
          {successMessage && (
            <div className="success-message">
              {successMessage.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '처리 중...' : '아이디 찾기'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login">로그인</Link> | <Link to="/find-password">비밀번호 찾기</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FindEmailForm;
