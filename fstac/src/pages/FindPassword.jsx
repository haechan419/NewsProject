import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findPassword } from '../api/authApi';
import FindPasswordForm from '../components/auth/FindPasswordForm';
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

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setValidationError('');
    setError('');
  };

  return (
    <FindPasswordForm
      email={email}
      onEmailChange={handleEmailChange}
      validationError={validationError}
      error={error}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
};

export default FindPassword;
