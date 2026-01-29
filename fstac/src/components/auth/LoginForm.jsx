import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import OAuthErrorMessages from './OAuthErrorMessages';
import { Button } from "@/components/ui/button"; // Button 컴포넌트 추가
import { cn } from "@/lib/util";

// 소셜 로그인 버튼을 lazy로 로드
const SocialLoginButtons = lazy(() => import('./SocialLoginButtons'));

// 얼굴 인식 컴포넌트를 lazy로 로드
const FaceRecognitionLogin = lazy(() => import('./FaceRecognitionLogin'));

const LoginForm = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  validationErrors,
  successMessage,
  showOAuthError,
  onOAuthErrorClose,
  error,
  isLoading,
  isKakaoLoginLoading,
  onSubmit,
  onKakaoLogin,
  onNaverLogin,
  onGoogleLogin,
  // 얼굴 인식 관련 props
  isCameraActive,
  isVideoReady,
  cameraError,
  isRecognizing,
  faceRecognitionMessage,
  autoRecognitionEnabled,
  videoRef,
  onCameraToggle,
  onFaceRecognition,
  onStopCamera,
  onAutoRecognitionToggle
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center px-4 py-10">
      <div className="max-w-5xl w-full mx-auto">
        <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm mb-8">
          로그인
        </h1>

        <div className="rounded-3xl bg-white shadow-[0_18px_60px_rgba(15,23,42,0.25)] border border-white/70 px-6 py-8 md:px-10 md:py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* 왼쪽: 얼굴 로그인 + 사설 인증서(소셜 로그인) */}
          <div className="flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">얼굴 로그인</h2>
              <p className="mt-2 text-xs md:text-sm text-slate-500">
                등록된 얼굴로 간편하게 로그인할 수 있습니다.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400 min-h-[200px]">
                  얼굴 인식 기능을 불러오는 중입니다...
                </div>
              }
            >
              <FaceRecognitionLogin
                isCameraActive={isCameraActive}
                isVideoReady={isVideoReady}
                cameraError={cameraError}
                isRecognizing={isRecognizing}
                isLoading={isLoading}
                faceRecognitionMessage={faceRecognitionMessage}
                autoRecognitionEnabled={autoRecognitionEnabled}
                videoRef={videoRef}
                onCameraToggle={onCameraToggle}
                onFaceRecognition={onFaceRecognition}
                onStopCamera={onStopCamera}
                onAutoRecognitionToggle={onAutoRecognitionToggle}
              />
            </Suspense>

            <p className="mt-6 text-[11px] leading-relaxed text-slate-400">
              얼굴 로그인을 처음 사용하는 경우, 프로필 수정에서 얼굴 정보를 먼저 등록해 주세요.<br />
              카메라 사용 시 브라우저의 권한 요청을 허용해야 정상적으로 동작합니다.
            </p>

            {/* 사설 인증서(소셜 로그인) */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="mb-3 text-sm font-medium text-slate-800 text-center">외부 로그인</div>
              <Suspense
                fallback={
                  <div className="text-center text-xs text-slate-400 py-3">
                    소셜 로그인 정보를 불러오는 중입니다...
                  </div>
                }
              >
                <div className="flex justify-center">
                  <SocialLoginButtons
                    onKakaoLogin={onKakaoLogin}
                    onNaverLogin={onNaverLogin}
                    onGoogleLogin={onGoogleLogin}
                    isKakaoLoginLoading={isKakaoLoginLoading}
                    isLoading={isLoading}
                  />
                </div>
              </Suspense>
            </div>
          </div>

          {/* 오른쪽: 일반(아이디/비밀번호) */}
          <div className="lg:border-l lg:border-slate-200 lg:pl-10">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-slate-900">아이디 로그인</h2>
              <p className="mt-2 text-xs md:text-sm text-slate-500">
                아이디와 비밀번호로 직접 로그인합니다.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              {successMessage && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}

              <OAuthErrorMessages
                showOAuthError={showOAuthError}
                onClose={onOAuthErrorClose}
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-1">
                  아이디 입력
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={onEmailChange}
                  placeholder="아이디(이메일)를 입력하세요"
                  disabled={isLoading}
                  className={cn(
                    "block w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all",
                    validationErrors.email ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'
                  )}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-800 mb-1">
                  비밀번호 입력
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={onPasswordChange}
                  placeholder="비밀번호를 입력하세요"
                  disabled={isLoading}
                  className={cn(
                    "block w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all",
                    validationErrors.password ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'
                  )}
                />
                {validationErrors.password && (
                  <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>
                )}
              </div>

              <div className="mt-7 space-y-3">
                {/* shadcn Button 적용: 로그인 */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full rounded-full py-6 text-base font-semibold transition-all",
                    "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  )}
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </Button>

                {/* shadcn Button 적용: 회원가입 (asChild를 사용하여 Link와 결합) */}
                <Button
                  variant="outline"
                  asChild
                  className="w-full rounded-full py-6 text-base font-semibold border-slate-300 text-slate-800 hover:bg-slate-50"
                >
                  <Link to="/signup">회원가입</Link>
                </Button>
              </div>
            </form>

            <div className="mt-6 flex w-full justify-center text-[11px] md:text-xs text-slate-500">
              <div className="space-x-3">
                <Link to="/find-email" className="hover:underline text-slate-600">
                  아이디 찾기
                </Link>
                <span className="text-slate-300">|</span>
                <Link to="/find-password" className="hover:underline text-slate-600">
                  비밀번호 찾기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;