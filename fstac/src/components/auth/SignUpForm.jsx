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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 shadow-2xl border border-white/40 backdrop-blur-lg px-8 py-10">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-500">
            이메일과 비밀번호, 닉네임을 입력하고 관심 카테고리를 선택해주세요.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={onEmailChange}
              placeholder="이메일을 입력하세요"
              disabled={isLoading}
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.email ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                }`}
            />
            {validationErrors.email && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={onPasswordChange}
              placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              disabled={isLoading}
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.password ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                }`}
            />
            {validationErrors.password && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={onConfirmPasswordChange}
              placeholder="비밀번호를 다시 입력하세요"
              disabled={isLoading}
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.confirmPassword
                  ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200'
                }`}
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              닉네임
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={onNicknameChange}
              placeholder="닉네임을 입력하세요 (2-20자)"
              disabled={isLoading}
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.nickname ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
                }`}
            />
            {validationErrors.nickname && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.nickname}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              관심 카테고리{' '}
              <span className="text-[11px] font-normal text-gray-500">(최대 3개 선택 가능)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableCategories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                const isDisabled = !isSelected && selectedCategories.length >= 3;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => onCategoryToggle(category)}
                    disabled={isLoading || isDisabled}
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${isSelected
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {category}
                    {isSelected && <span className="ml-1.5 text-[11px]">✓</span>}
                  </button>
                );
              })}
            </div>
            {validationErrors.categories && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.categories}</p>
            )}
            {selectedCategories.length > 0 && (
              <p className="mt-1 text-[11px] text-gray-500">
                선택된 카테고리: {selectedCategories.join(', ')} ({selectedCategories.length}/3)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpForm;
