import { Link } from 'react-router-dom';

const ResetPasswordForm = ({
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  validationErrors,
  error,
  isLoading,
  token,
  onSubmit
}) => {
  return (
    <div className="reset-password-container">
      <div className="reset-password-box">
        <h2 className="reset-password-title">비밀번호 재설정</h2>
        <form onSubmit={onSubmit} className="reset-password-form">
          <div className="form-group">
            <label htmlFor="newPassword">새 비밀번호</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={onNewPasswordChange}
              className={validationErrors.newPassword ? 'error' : ''}
              placeholder="새 비밀번호를 입력하세요 (최소 8자, 영문/숫자/특수문자 포함)"
              disabled={isLoading || !token}
            />
            {validationErrors.newPassword && (
              <span className="error-message">{validationErrors.newPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={onConfirmPasswordChange}
              className={validationErrors.confirmPassword ? 'error' : ''}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={isLoading || !token}
            />
            {validationErrors.confirmPassword && (
              <span className="error-message">{validationErrors.confirmPassword}</span>
            )}
          </div>

          {error && <div className="error-message server-error">{error}</div>}

          <button type="submit" className="reset-password-button" disabled={isLoading || !token}>
            {isLoading ? '처리 중...' : '비밀번호 재설정'}
          </button>
        </form>

        <div className="reset-password-footer">
          <p>
            <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
