import { Link } from 'react-router-dom';

const SignUpForm = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  nickname,
  onNicknameChange,
  selectedCategories,
  availableCategories,
  onCategoryToggle,
  validationErrors,
  error,
  isLoading,
  onSubmit
}) => {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">회원가입</h2>
        <form onSubmit={onSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={onEmailChange}
              className={validationErrors.email ? 'error' : ''}
              placeholder="이메일을 입력하세요"
              disabled={isLoading}
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={onPasswordChange}
              className={validationErrors.password ? 'error' : ''}
              placeholder="비밀번호를 입력하세요 (영문, 숫자, 특수문자 포함 8자 이상)"
              disabled={isLoading}
            />
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
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
              disabled={isLoading}
            />
            {validationErrors.confirmPassword && (
              <span className="error-message">{validationErrors.confirmPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={onNicknameChange}
              className={validationErrors.nickname ? 'error' : ''}
              placeholder="닉네임을 입력하세요 (2-20자)"
              disabled={isLoading}
            />
            {validationErrors.nickname && (
              <span className="error-message">{validationErrors.nickname}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="categories">
              관심 카테고리 <span className="category-hint">(최대 3개 선택 가능)</span>
            </label>
            <div className="category-selector">
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                const isDisabled = !isSelected && selectedCategories.length >= 3;
                return (
                  <button
                    key={category}
                    type="button"
                    className={`category-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => onCategoryToggle(category)}
                    disabled={isLoading || isDisabled}
                  >
                    {category}
                    {isSelected && <span className="check-icon">✓</span>}
                  </button>
                );
              })}
            </div>
            {validationErrors.categories && (
              <span className="error-message">{validationErrors.categories}</span>
            )}
            {selectedCategories.length > 0 && (
              <div className="category-selected-info">
                선택된 카테고리: {selectedCategories.join(', ')} ({selectedCategories.length}/3)
              </div>
            )}
          </div>

          {error && <div className="error-message server-error">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
