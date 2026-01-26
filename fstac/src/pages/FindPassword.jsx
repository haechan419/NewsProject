import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { findPassword } from '../api/authApi';
import '../styles/common.css';
import './FindPassword.css';

const FindPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 유효성 검사
  const validate = () => {
    if (!email.trim()) {
      setValidationError('이메일을 입력해주세요.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('올바른 이메일 형식이 아닙니다.');
      return false;
    }
    setValidationError('');
    return true;
  };

  // 비밀번호 찾기 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const token = await findPassword(email);
      // 토큰을 받아서 비밀번호 재설정 페이지로 이동
      navigate(`/reset-password?token=${token}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || '비밀번호 찾기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">비밀번호 찾기</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setValidationError('');
                setError('');
              }}
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

export default FindPassword;
