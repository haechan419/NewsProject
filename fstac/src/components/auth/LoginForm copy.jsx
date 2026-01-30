import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import OAuthErrorMessages from './OAuthErrorMessages';

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
    //   <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 flex items-center justify-center px-4 py-10">
    //     <div className="max-w-5xl w-full mx-auto">
    //       <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
    //         로그인
    //       </h1>

    //       <div className="mt-8 rounded-3xl bg-white shadow-[0_18px_60px_rgba(15,23,42,0.25)] border border-white/70 px-6 py-8 md:px-10 md:py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
    //         {/* 왼쪽: 얼굴 로그인 + 사설 인증서(소셜 로그인) */}
    //         <div className="flex flex-col">
    //           <div className="mb-6">
    //             <h2 className="text-xl font-semibold text-slate-900">얼굴 로그인</h2>
    //             <p className="mt-2 text-xs md:text-sm text-slate-500">
    //               등록된 얼굴로 간편하게 로그인할 수 있습니다. 카메라를 통해 사용자를 인식해 보다 안전한
    //               로그인 경험을 제공합니다.
    //             </p>
    //           </div>

    //           <Suspense
    //             fallback={
    //               <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
    //                 얼굴 인식 기능을 불러오는 중입니다...
    //               </div>
    //             }
    //           >
    //             <FaceRecognitionLogin
    //               isCameraActive={isCameraActive}
    //               isVideoReady={isVideoReady}
    //               cameraError={cameraError}
    //               isRecognizing={isRecognizing}
    //               isLoading={isLoading}
    //               faceRecognitionMessage={faceRecognitionMessage}
    //               autoRecognitionEnabled={autoRecognitionEnabled}
    //               videoRef={videoRef}
    //               onCameraToggle={onCameraToggle}
    //               onFaceRecognition={onFaceRecognition}
    //               onStopCamera={onStopCamera}
    //               onAutoRecognitionToggle={onAutoRecognitionToggle}
    //             />
    //           </Suspense>

    //           <p className="mt-6 text-[11px] leading-relaxed text-slate-400">
    //             얼굴 로그인을 처음 사용하는 경우, 마이페이지에서 얼굴 정보를 먼저 등록해 주세요.
    //             카메라 사용 시 브라우저의 권한 요청을 허용해야 정상적으로 동작합니다.
    //           </p>

    //           {/* 사설 인증서(소셜 로그인) */}
    //           <div className="mt-8 border-t border-slate-200 pt-6">
    //             <div className="mb-3 text-sm font-medium text-slate-800">사설 인증서</div>
    //             <Suspense
    //               fallback={
    //                 <div className="text-center text-xs text-slate-400 py-3">
    //                   소셜 로그인 정보를 불러오는 중입니다...
    //                 </div>
    //               }
    //             >
    //               <SocialLoginButtons
    //                 onKakaoLogin={onKakaoLogin}
    //                 onNaverLogin={onNaverLogin}
    //                 onGoogleLogin={onGoogleLogin}
    //                 isKakaoLoginLoading={isKakaoLoginLoading}
    //                 isLoading={isLoading}
    //               />
    //             </Suspense>
    //             <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
    //               얼굴 로그인 및 사설 인증서를 사용하려면 먼저 아이디와 비밀번호로 1회 로그인 후 얼굴·소셜 정보를
    //               등록해야 할 수 있습니다.
    //             </p>
    //           </div>
    //         </div>

    //         {/* 오른쪽: 일반(아이디/비밀번호) + 소셜 로그인 */}
    //         <div className="lg:border-l lg:border-slate-200 lg:pl-10">
    //           <div>
    //             <h2 className="text-xl md:text-2xl font-semibold text-slate-900">로그인</h2>
    //             <p className="mt-2 text-xs md:text-sm text-slate-500">
    //               아이디와 비밀번호 또는 소셜 계정으로 로그인합니다.
    //             </p>
    //           </div>

    //           <form onSubmit={onSubmit} className="mt-8 space-y-5">
    //             {successMessage && (
    //               <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
    //                 {successMessage}
    //               </div>
    //             )}

    //             <OAuthErrorMessages
    //               showOAuthError={showOAuthError}
    //               onClose={onOAuthErrorClose}
    //             />

    //             {error && (
    //               <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
    //                 {error}
    //               </div>
    //             )}

    //             <div>
    //               <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-1">
    //                 아이디 입력
    //               </label>
    //               <input
    //                 type="email"
    //                 id="email"
    //                 value={email}
    //                 onChange={onEmailChange}
    //                 placeholder="아이디(이메일)를 입력하세요"
    //                 disabled={isLoading}
    //                 className={`block w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.email ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'
    //                   }`}
    //               />
    //               {validationErrors.email && (
    //                 <p className="mt-1 text-xs text-red-500">{validationErrors.email}</p>
    //               )}
    //             </div>

    //             <div>
    //               <label htmlFor="password" className="block text-sm font-medium text-slate-800 mb-1">
    //                 비밀번호 입력
    //               </label>
    //               <input
    //                 type="password"
    //                 id="password"
    //                 value={password}
    //                 onChange={onPasswordChange}
    //                 placeholder="비밀번호를 입력하세요"
    //                 disabled={isLoading}
    //                 className={`block w-full rounded-xl border px-3 py-2.5 text-sm shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${validationErrors.password ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-200'
    //                   }`}
    //               />
    //               {validationErrors.password && (
    //                 <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>
    //               )}
    //             </div>

    //             <div className="mt-7 space-y-3">
    //               <button
    //                 type="submit"
    //                 disabled={isLoading}
    //                 className="inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
    //               >
    //                 {isLoading ? '로그인 중...' : '로그인'}
    //               </button>
    //               <Link
    //                 to="/signup"
    //                 className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
    //               >
    //                 회원가입
    //               </Link>
    //             </div>
    //           </form>

    //           <div className="mt-6 flex flex-wrap items-center justify-between text-[11px] md:text-xs text-slate-500 gap-2">
    //             <div className="space-x-3">
    //               <Link to="/find-email" className="hover:underline text-slate-600">
    //                 아이디 찾기
    //               </Link>
    //               <span className="text-slate-300">|</span>
    //               <Link to="/find-password" className="hover:underline text-slate-600">
    //                 비밀번호 찾기
    //               </Link>
    //             </div>
    //             <span className="text-slate-400">
    //               보안을 위해 공용 PC에서는 사용 후 반드시 로그아웃 해 주세요.
    //             </span>
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    <div className="bg-blue-500 text-white p-4 rounded-lg">
      Tailwind 테스트
    </div>
  );
};

export default LoginForm;
