import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, getCategories } from '../api/authApi';
import SignUpForm from '../components/auth/SignUpForm';
import '../styles/common.css';
import './SignUp.css';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  // 카테고리 목록 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getCategories();
        setAvailableCategories(categories);
      } catch (err) {
        console.error('카테고리 목록 로드 실패:', err);
        // 기본 카테고리 목록 설정
        setAvailableCategories(['정치', '경제', '엔터', 'IT/과학', '스포츠', '국제']);
      }
    };
    loadCategories();
  }, []);

  // 카테고리 선택/해제 핸들러
  const handleCategoryToggle = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // 이미 선택된 경우 제거
        return prev.filter(cat => cat !== category);
      } else {
        // 최대 3개까지만 선택 가능
        if (prev.length >= 3) {
          setValidationErrors({
            ...validationErrors,
            categories: '관심 카테고리는 최대 3개까지 선택할 수 있습니다.'
          });
          return prev;
        }
        setValidationErrors({
          ...validationErrors,
          categories: ''
        });
        return [...prev, category];
      }
    });
  };

  // 유효성 검사
  const validate = () => {
    const errors = {};

    // 이메일 검증
    if (!email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.';
    }

    // 비밀번호 검증
    if (!password.trim()) {
      errors.password = '비밀번호를 입력해주세요.';
    } else if (password.length < 8) {
      errors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(password)) {
      errors.password = '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.';
    }

    // 비밀번호 확인 검증
    if (!confirmPassword.trim()) {
      errors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    // 닉네임 검증
    if (!nickname.trim()) {
      errors.nickname = '닉네임을 입력해주세요.';
    } else if (nickname.length < 2 || nickname.length > 20) {
      errors.nickname = '닉네임은 2자 이상 20자 이하여야 합니다.';
    }

    // 카테고리 검증 (선택사항이지만 선택 시 최대 3개)
    if (selectedCategories.length > 3) {
      errors.categories = '관심 카테고리는 최대 3개까지 선택할 수 있습니다.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 회원가입 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      await signUp({
        email,
        password,
        nickname,
        categories: selectedCategories, // 선택한 카테고리 전송
      });
      // 회원가입 성공 시 로그인 페이지로 이동
      navigate('/login', { state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' } });
    } catch (err) {
      // 서버에서 반환한 에러 메시지 처리
      const errorMessage = err.response?.data?.message || err.message || '회원가입에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setValidationErrors({ ...validationErrors, email: '' });
    setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setValidationErrors({ ...validationErrors, password: '' });
    setError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setValidationErrors({ ...validationErrors, confirmPassword: '' });
    setError('');
  };

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    setValidationErrors({ ...validationErrors, nickname: '' });
    setError('');
  };

  return (
    <SignUpForm
      email={email}
      onEmailChange={handleEmailChange}
      password={password}
      onPasswordChange={handlePasswordChange}
      confirmPassword={confirmPassword}
      onConfirmPasswordChange={handleConfirmPasswordChange}
      nickname={nickname}
      onNicknameChange={handleNicknameChange}
      selectedCategories={selectedCategories}
      availableCategories={availableCategories}
      onCategoryToggle={handleCategoryToggle}
      validationErrors={validationErrors}
      error={error}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
};

export default SignUp;
