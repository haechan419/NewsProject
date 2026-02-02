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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 shadow-2xl border border-white/40 backdrop-blur-lg px-8 py-10">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">비밀번호 재설정</h2>
          <p className="mt-2 text-sm text-gray-500">
            새 비밀번호를 입력하고 확인해 주세요. 보안 강도를 위해 영문, 숫자, 특수문자를 함께 사용하는 것을
            권장합니다.
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={onNewPasswordChange}
              placeholder="최소 8자, 영문/숫자/특수문자 포함"
              disabled={isLoading || !token}
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                validationErrors.newPassword
                  ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200'
              }`}
            />
            {validationErrors.newPassword && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.newPassword}</p>
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
              disabled={isLoading || !token}
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                validationErrors.confirmPassword
                  ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-200'
              }`}
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : '비밀번호 재설정'}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
          <Link to="/login" className="text-indigo-600 hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
