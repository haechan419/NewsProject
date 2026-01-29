const SocialLoginButtons = ({
  onKakaoLogin,
  onNaverLogin,
  onGoogleLogin,
  isKakaoLoginLoading,
  isLoading
}) => {
  const isDisabled = isKakaoLoginLoading || isLoading;

  // 카카오 로고 이미지
  const KakaoLogo = () => (
    <img
      src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png"
      alt="카카오톡"
      className="w-5 h-5 object-contain"
    />
  );

  // 네이버 로고 SVG
  const NaverLogo = () => (
    <img
      src="/iconUpload/NAVER_login_Light_KR_green_icon_H48.png"
      alt="네이버"
      className="w-5 h-5 object-contain"
    />
  );

  // 구글 로고 SVG
  const GoogleLogo = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.965-2.18l-2.908-2.258c-.806.54-1.837.86-3.057.86-2.35 0-4.34-1.587-5.055-3.72H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.945 10.702c-.18-.54-.282-1.117-.282-1.702s.102-1.162.282-1.702V4.966H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.034l2.988-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.966L3.945 7.3C4.66 5.163 6.65 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onKakaoLogin}
        disabled={isDisabled}
        className="h-11 w-11 rounded-full bg-[#FEE500] shadow hover:bg-[#FDD835] flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        aria-label="카카오 로그인"
      >
        <KakaoLogo />
      </button>
      <button
        type="button"
        onClick={onNaverLogin}
        disabled={isDisabled}
        className="h-11 w-11 rounded-full bg-[#03C75A] shadow hover:bg-[#02b654] flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        aria-label="네이버 로그인"
      >
        <NaverLogo />
      </button>
      <button
        type="button"
        onClick={onGoogleLogin}
        disabled={isDisabled}
        className="h-11 w-11 rounded-full bg-white border border-slate-300 shadow hover:bg-slate-50 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        aria-label="구글 로그인"
      >
        <GoogleLogo />
      </button>
    </div>
  );
};

export default SocialLoginButtons;