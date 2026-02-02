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
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl bg-white/95 shadow-2xl border border-white/40 backdrop-blur-lg px-8 py-10">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">비밀번호 찾기</h2>
          <p className="mt-2 text-sm text-gray-500">
            계정에 등록된 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
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
              className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                validationError ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-200'
              }`}
            />
            {validationError && (
              <p className="mt-1 text-xs text-red-500">{validationError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? '처리 중...' : '비밀번호 찾기'}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-100 pt-4 text-center text-xs text-gray-500 space-y-1">
          <p>
            <Link to="/login" className="text-indigo-600 hover:underline">
              로그인
            </Link>{' '}
            ·{' '}
            <Link to="/find-email" className="text-indigo-600 hover:underline">
              아이디 찾기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FindPasswordForm;
