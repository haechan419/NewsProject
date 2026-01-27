import { Link } from 'react-router-dom';

const FindPasswordForm = ({
  email,
  onEmailChange,
  validationError,
  error,
  isLoading,
  onSubmit
}) => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">비밀번호 찾기</h2>
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={onEmailChange}
              className={validationError ? 'error' : ''}
              placeholder="이메일을 입력하세요"
              disabled={isLoading}
            />
            {validationError && (
              <span className="error-message">{validationError}</span>
            )}
          </div>

          {error && <div className="error-message server-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '처리 중...' : '비밀번호 찾기'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/login">로그인</Link> | <Link to="/find-email">아이디 찾기</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FindPasswordForm;
