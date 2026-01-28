import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { findEmail } from '../api/authApi';
import '../styles/common.css';
import './FindEmail.css';

const FindEmail = () => {
  const [nickname, setNickname] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // 유효성 검사
  const validate = () => {
    if (!nickname.trim()) {
      setValidationError('닉네임을 입력해주세요.');
      return false;
    }
    if (nickname.length < 2 || nickname.length > 20) {
      setValidationError('닉네임은 2자 이상 20자 이하여야 합니다.');
      return false;
    }
    setValidationError('');
    return true;
  };

  // 아이디 찾기 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const email = await findEmail(nickname);
      setSuccessMessage(`아이디 찾기 성공!\n이메일: ${email}`);
      setNickname('');
    } catch (err) {
      // 400 (Bad Request) 또는 404 (Not Found) 에러는 사용자 입력 오류
      // 401 (Unauthorized)는 인증 오류이므로 정상적인 경우가 아님
      const status = err.response?.status;
      const errorMessage = err.response?.data?.message || err.message || '아이디 찾기에 실패했습니다.';
      
      if (status === 400 || status === 404) {
        setError(errorMessage);
      } else if (status === 401) {
        // 401은 예상치 못한 경우이므로 더 명확한 메시지 표시
        setError('인증 오류가 발생했습니다. 다시 시도해주세요.');
        console.error('예상치 못한 401 에러:', err);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">아이디 찾기</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setValidationError('');
                setError('');
              }}
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

export default FindEmail;
