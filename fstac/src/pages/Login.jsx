import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginAsync, clearError, setCredentials, fetchUserInfoAsync } from '../slices/authSlice';
import { recognizeFace } from '../api/faceApi';
import { faceLogin } from '../api/authApi';
import LoginForm from '../components/auth/LoginForm';
import '../styles/common.css';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isKakaoLoginLoading, setIsKakaoLoginLoading] = useState(false);
  const [showOAuthError, setShowOAuthError] = useState(null);
  
  // 얼굴 인식 관련 상태
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [faceRecognitionMessage, setFaceRecognitionMessage] = useState('');
  const [autoRecognitionEnabled, setAutoRecognitionEnabled] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const autoRecognitionIntervalRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  
  // 회원가입 성공 메시지 확인
  const successMessage = location.state?.message;

  // OAuth 에러 확인 및 URL 정리
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const oauthError = urlParams.get('error');
    
    if (oauthError) {
      // OAuth 에러 타입 저장
      setShowOAuthError(oauthError);
      // 카카오 로그인 로딩 상태 초기화
      setIsKakaoLoginLoading(false);
      // URL에서 에러 파라미터 제거 (깔끔한 URL 유지)
      window.history.replaceState({}, '', '/login');
    } else {
      setShowOAuthError(null);
    }
  }, [location]);

  // 소셜 로그인 성공 감지 플래그 (중복 실행 방지)
  const oauthNotificationShownRef = useRef(false);

  // 소셜 로그인 성공 감지 (OAuth 리다이렉트 후)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const oauthSuccess = urlParams.get('oauth');
    
    // 이미 처리되었으면 다시 처리하지 않음
    if (oauthSuccess === 'success' && !oauthNotificationShownRef.current) {
      oauthNotificationShownRef.current = true; // 플래그 설정
      
      // 사용자 정보 조회 (OAuth 성공 후 쿠키에 토큰이 저장되어 있음)
      const fetchUserAndNavigate = async () => {
        try {
          const result = await dispatch(fetchUserInfoAsync());
          
          // URL에서 파라미터 제거 (이동 전에)
          window.history.replaceState({}, '', '/login');
          
          if (fetchUserInfoAsync.fulfilled.match(result)) {
            // 즉시 홈으로 이동
            navigate('/', { replace: true });
          } else {
            // 재시도
            setTimeout(async () => {
              const retryResult = await dispatch(fetchUserInfoAsync());
              window.history.replaceState({}, '', '/login');
              navigate('/', { replace: true });
            }, 1000);
          }
        } catch (error) {
          console.error('소셜 로그인 처리 중 오류:', error);
          // URL에서 파라미터 제거
          window.history.replaceState({}, '', '/login');
          // 에러가 발생해도 홈으로 이동
          navigate('/', { replace: true });
        }
      };
      
      fetchUserAndNavigate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // 유효성 검사
  const validate = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!password.trim()) {
      errors.password = '비밀번호를 입력해주세요.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 로그인 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    setValidationErrors({});

    if (!validate()) {
      return;
    }

    try {
      const result = await dispatch(loginAsync({ email, password }));
      if (loginAsync.fulfilled.match(result)) {
        // 사용자 정보 조회 후 홈으로 이동
        await dispatch(fetchUserInfoAsync());
        navigate('/');
      }
    } catch (err) {
      // 에러는 Redux에서 처리됨
    }
  };

  // OAuth 로그인 핸들러 공통 함수
  const handleOAuthLogin = (provider) => {
    // 이미 로딩 중이면 무시
    if (isKakaoLoginLoading) {
      return;
    }
    
    setIsKakaoLoginLoading(true);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    
    // 리다이렉트 전에 약간의 지연을 두어 중복 클릭 방지
    setTimeout(() => {
      window.location.href = `${apiBaseUrl}/oauth2/authorization/${provider}`;
    }, 100);
  };

  // 카카오 로그인 핸들러
  const handleKakaoLogin = () => handleOAuthLogin('kakao');

  // 네이버 로그인 핸들러
  const handleNaverLogin = () => handleOAuthLogin('naver');

  // 구글 로그인 핸들러
  const handleGoogleLogin = () => handleOAuthLogin('google');

  // 카메라 시작
  const startCamera = async () => {
    try {
      setCameraError('');
      setFaceRecognitionMessage('');
      setIsCameraActive(true);
      setIsVideoReady(false);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('이 브라우저는 카메라를 지원하지 않습니다.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      const setupVideo = () => {
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          setIsVideoReady(false);
          
          let timeoutId = null;
          
          const handleVideoReady = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            setIsVideoReady(true);
          };
          
          video.onloadedmetadata = () => {
            video.play()
              .then(() => {
                handleVideoReady();
              })
              .catch(err => {
                console.error('비디오 재생 에러:', err);
                handleVideoReady();
              });
          };
          
          video.onplaying = () => {
            handleVideoReady();
          };
          
          video.onerror = (err) => {
            console.error('비디오 에러:', err);
            setTimeout(() => {
              if (videoRef.current && videoRef.current.srcObject) {
                handleVideoReady();
              }
            }, 1000);
          };
          
          timeoutId = setTimeout(() => {
            if (videoRef.current && videoRef.current.srcObject) {
              handleVideoReady();
            }
          }, 3000);
        } else {
          setTimeout(setupVideo, 100);
        }
      };
      
      setupVideo();
    } catch (error) {
      console.error('카메라 접근 에러:', error);
      let errorMessage = '카메라에 접근할 수 없습니다.';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = '카메라에 접근할 수 없습니다. 다른 애플리케이션에서 카메라를 사용 중일 수 있습니다.';
      }
      
      setCameraError(errorMessage);
    }
  };

  // 카메라 종료
  const stopCamera = () => {
    // 자동 인식 인터벌 정리
    if (autoRecognitionIntervalRef.current) {
      clearInterval(autoRecognitionIntervalRef.current);
      autoRecognitionIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
    setFaceRecognitionMessage('');
    setIsRecognizing(false);
  };

  // 얼굴 인식 및 로그인 (자동/수동 공통 함수)
  const performFaceRecognition = useCallback(async (isAuto = false) => {
    if (!videoRef.current) {
      if (!isAuto) {
        setFaceRecognitionMessage('카메라가 준비되지 않았습니다.');
      }
      return false;
    }

    const video = videoRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      if (!isAuto) {
        setFaceRecognitionMessage('카메라가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      }
      return false;
    }

    // 이미 인식 중이면 스킵
    if (isRecognizing) {
      return false;
    }

    setIsRecognizing(true);
    if (!isAuto) {
      setFaceRecognitionMessage('얼굴을 인식하는 중...');
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = canvas.toDataURL('image/png');
      
      // 얼굴 인식 API 호출
      const response = await recognizeFace(imageData);
      
      if (response.success && response.data?.faceDetected && response.data?.matchedUserId) {
        const matchedEmail = response.data.matchedUserId;
        setFaceRecognitionMessage('얼굴 인식 성공! 로그인 중...');
        
        // 자동 인식 인터벌 정리
        if (autoRecognitionIntervalRef.current) {
          clearInterval(autoRecognitionIntervalRef.current);
          autoRecognitionIntervalRef.current = null;
        }
        
        // 얼굴 인식 로그인 API 호출
        try {
          const loginResponse = await faceLogin(matchedEmail);
          
          // Redux에 사용자 정보 저장
          dispatch(setCredentials({ user: loginResponse.user }));
          
          // 사용자 정보 조회
          await dispatch(fetchUserInfoAsync());
          
          setFaceRecognitionMessage('로그인 성공!');
          
          stopCamera();
          
          // 홈으로 이동
          navigate('/');
          
          return true; // 성공
        } catch (loginError) {
          console.error('얼굴 인식 로그인 에러:', loginError);
          setFaceRecognitionMessage('로그인 처리 중 오류가 발생했습니다.');
          return false;
        }
      } else {
        if (!isAuto) {
          setFaceRecognitionMessage('등록된 얼굴을 찾을 수 없습니다. 다시 시도해주세요.');
        } else {
          // 자동 인식 시에는 메시지를 표시하지 않음 (너무 자주 표시됨)
        }
        return false;
      }
    } catch (error) {
      console.error('얼굴 인식 에러:', error);
      if (!isAuto) {
        const errorMessage = error.response?.data?.data?.message || 
                            error.response?.data?.message ||
                            error.response?.data?.error || 
                            error.message || 
                            '얼굴 인식 중 오류가 발생했습니다.';
        setFaceRecognitionMessage(errorMessage);
      }
      return false;
    } finally {
      setIsRecognizing(false);
    }
  }, [dispatch, navigate]);

  // 수동 얼굴 인식 핸들러
  const handleFaceRecognition = () => {
    performFaceRecognition(false);
  };

  // 카메라 토글 
  const handleCameraToggle = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setValidationErrors({ ...validationErrors, email: '' });
    dispatch(clearError());
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setValidationErrors({ ...validationErrors, password: '' });
    dispatch(clearError());
  };

  const handleOAuthErrorClose = () => {
    setShowOAuthError(null);
  };

  const handleAutoRecognitionToggle = () => {
    setAutoRecognitionEnabled(!autoRecognitionEnabled);
  };

  // 자동 얼굴 인식 시작 (비디오 준비 완료 시)
  useEffect(() => {
    if (isVideoReady && isCameraActive && autoRecognitionEnabled && !isRecognizing) {
      // 자동 인식 인터벌 시작 (10초마다)
      if (!autoRecognitionIntervalRef.current) {
        setFaceRecognitionMessage('자동 얼굴 인식이 시작되었습니다...');
        
        autoRecognitionIntervalRef.current = setInterval(() => {
          if (isCameraActive && !isRecognizing) {
            performFaceRecognition(true);
          }
        }, 10000); // 10초마다 실행
        
        // 첫 번째 인식은 즉시 실행 (3초 후)
        const firstTimeout = setTimeout(() => {
          if (isCameraActive && !isRecognizing) {
            performFaceRecognition(true);
          }
        }, 3000);
        
        return () => {
          if (autoRecognitionIntervalRef.current) {
            clearInterval(autoRecognitionIntervalRef.current);
            autoRecognitionIntervalRef.current = null;
          }
          clearTimeout(firstTimeout);
        };
      }
    } else {
      // 자동 인식이 비활성화되면 인터벌 정리
      if (autoRecognitionIntervalRef.current) {
        clearInterval(autoRecognitionIntervalRef.current);
        autoRecognitionIntervalRef.current = null;
      }
    }
    
    return () => {
      if (autoRecognitionIntervalRef.current) {
        clearInterval(autoRecognitionIntervalRef.current);
        autoRecognitionIntervalRef.current = null;
      }
    };
  }, [isVideoReady, isCameraActive, autoRecognitionEnabled, isRecognizing, performFaceRecognition]);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      if (autoRecognitionIntervalRef.current) {
        clearInterval(autoRecognitionIntervalRef.current);
        autoRecognitionIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <LoginForm
      email={email}
      onEmailChange={handleEmailChange}
      password={password}
      onPasswordChange={handlePasswordChange}
      validationErrors={validationErrors}
      successMessage={successMessage}
      showOAuthError={showOAuthError}
      onOAuthErrorClose={handleOAuthErrorClose}
      error={error}
      isLoading={isLoading}
      isKakaoLoginLoading={isKakaoLoginLoading}
      onSubmit={handleSubmit}
      onKakaoLogin={handleKakaoLogin}
      onNaverLogin={handleNaverLogin}
      onGoogleLogin={handleGoogleLogin}
      isCameraActive={isCameraActive}
      isVideoReady={isVideoReady}
      cameraError={cameraError}
      isRecognizing={isRecognizing}
      faceRecognitionMessage={faceRecognitionMessage}
      autoRecognitionEnabled={autoRecognitionEnabled}
      videoRef={videoRef}
      onCameraToggle={handleCameraToggle}
      onFaceRecognition={handleFaceRecognition}
      onStopCamera={stopCamera}
      onAutoRecognitionToggle={handleAutoRecognitionToggle}
    />
  );
};

export default Login;
