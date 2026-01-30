import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/authApi';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // URL에서 토큰 가져오기
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('유효하지 않은 링크입니다.');
    }
  }, [searchParams]);

  // 유효성 검사
  const validate = () => {
    const errors = {};

    if (!newPassword.trim()) {
      errors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (newPassword.length < 8) {
      errors.newPassword = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(newPassword)) {
      errors.newPassword = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 비밀번호 재설정 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) {
      return;
    }

    if (!token) {
      setError('유효하지 않은 토큰입니다.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      alert('비밀번호가 성공적으로 변경되었습니다.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    setValidationErrors({ ...validationErrors, newPassword: '' });
    setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setValidationErrors({ ...validationErrors, confirmPassword: '' });
    setError('');
  };

  return (
    <ResetPasswordForm
      newPassword={newPassword}
      onNewPasswordChange={handleNewPasswordChange}
      confirmPassword={confirmPassword}
      onConfirmPasswordChange={handleConfirmPasswordChange}
      validationErrors={validationErrors}
      error={error}
      isLoading={isLoading}
      token={token}
      onSubmit={handleSubmit}
    />
  );
};

export default ResetPassword;
