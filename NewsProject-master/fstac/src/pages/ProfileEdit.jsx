import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserInfoAsync, logoutAsync } from '../slices/authSlice';
import { updateProfile, getCategories, getMyCategories, updateCategories, uploadProfileImage, deleteProfileImage, deactivateAccount } from '../api/authApi';
import { convertDisplayNamesToCategories, convertCategoriesToDisplayNames } from '../api/categoryApi';
import { registerFace } from '../api/faceApi';
import ProfileEditForm from '../components/auth/ProfileEditForm';

const ProfileEdit = () => {
  const [nickname, setNickname] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // 프로필 이미지 관련 상태
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [profileImageMessage, setProfileImageMessage] = useState('');

  // 얼굴 등록 관련 상태
  const [faceImage, setFaceImage] = useState(null);
  const [facePreview, setFacePreview] = useState(null);
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);
  const [faceMessage, setFaceMessage] = useState('');
  const fileInputRef = useRef(null);

  const profileImageInputRef = useRef(null);

  // 카메라 관련 상태
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading } = useSelector((state) => state.auth);

  // 사용자 정보 로드
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      // 사용자 카테고리 로드 (서버에서 받은 영문 카테고리를 한글로 변환)
      if (user.categories) {
        const koreanCategories = convertCategoriesToDisplayNames(user.categories);
        setSelectedCategories(koreanCategories);
      }
      // 프로필 이미지 즉시 설정 (페이지 진입 시 또는 user 업데이트 시)
      if (!profileImageFile) {
        const existingProfileImage = user?.profileImageUrl;
        if (existingProfileImage) {
          // 로컬 미리보기가 아닐 때만 서버 이미지로 설정
          const isLocalPreview = profileImagePreview && profileImagePreview.startsWith('data:');
          if (!isLocalPreview) {
            // 상대 경로인 경우 절대 URL로 변환
            const imageUrl = existingProfileImage.startsWith('http')
              ? existingProfileImage
              : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${existingProfileImage}`;
            setProfileImagePreview(imageUrl);
          }
        }
      }
    } else {
      // 사용자 정보가 없으면 조회 시도
      dispatch(fetchUserInfoAsync());
    }
  }, [user, dispatch]);

  // 프로필 이미지 설정: user가 변경되거나 profileImageFile이 변경될 때
  useEffect(() => {
    // 로컬 파일이 선택되지 않은 경우에만 서버 이미지 사용
    if (!profileImageFile && user) {
      // 백엔드에서 profileImageUrl 필드로 반환됨
      const existingProfileImage = user?.profileImageUrl;

      // 로컬 미리보기(data: URL)가 아닐 때만 서버 이미지로 업데이트
      const isLocalPreview = profileImagePreview && profileImagePreview.startsWith('data:');

      if (existingProfileImage) {
        // 서버 이미지가 있고, 로컬 미리보기가 아니면 항상 업데이트
        if (!isLocalPreview) {
          // 상대 경로인 경우 절대 URL로 변환
          const imageUrl = existingProfileImage.startsWith('http')
            ? existingProfileImage
            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${existingProfileImage}`;
          setProfileImagePreview(imageUrl);
        }
      } else {
        // 서버에 이미지가 없고 로컬 미리보기도 없으면 null
        if (!isLocalPreview) {
          setProfileImagePreview(null);
        }
      }
    }
  }, [user, profileImageFile]);

  // 카테고리 목록 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await getCategories();
        // 서버에서 받은 영문 카테고리를 한글로 변환
        const koreanCategories = convertCategoriesToDisplayNames(categories);
        setAvailableCategories(koreanCategories);
      } catch (err) {
        console.error('카테고리 목록 로드 실패:', err);
        // 기본 카테고리 목록 설정
        setAvailableCategories(['정치', '경제', '문화', 'IT/과학', '사회', '국제']);
      }
    };
    loadCategories();
  }, []);

  // 현재 사용자 카테고리 로드 (사용자 정보에 카테고리가 없는 경우)
  useEffect(() => {
    const loadUserCategories = async () => {
      if (user && (!user.categories || user.categories.length === 0)) {
        try {
          const categories = await getMyCategories();
          // 서버에서 받은 영문 카테고리를 한글로 변환
          const koreanCategories = convertCategoriesToDisplayNames(categories);
          setSelectedCategories(koreanCategories);
        } catch (err) {
          console.error('사용자 카테고리 로드 실패:', err);
        }
      }
    };
    loadUserCategories();
  }, [user]);

  // OAuth 로그인으로 자동 생성된 닉네임인지 확인 (예: 한해찬_1, 한해찬_2)
  const isAutoGeneratedNickname = user?.nickname && /_\d+$/.test(user.nickname);

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

  // 닉네임 유효성 검사
  const validateNickname = () => {
    const errors = {};

    if (!nickname.trim()) {
      errors.nickname = '닉네임을 입력해주세요.';
    } else if (nickname.trim().length < 2) {
      errors.nickname = '닉네임은 2자 이상이어야 합니다.';
    } else if (nickname.trim().length > 20) {
      errors.nickname = '닉네임은 20자 이하여야 합니다.';
    } else if (!/^[가-힣a-zA-Z0-9]+$/.test(nickname.trim())) {
      errors.nickname = '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.';
    }

    setValidationErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // 카테고리 유효성 검사
  const validateCategories = () => {
    const errors = {};

    if (selectedCategories.length > 3) {
      errors.categories = '관심 카테고리는 최대 3개까지 선택할 수 있습니다.';
    }

    setValidationErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // 닉네임 수정 핸들러
  const handleNicknameSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors(prev => ({ ...prev, nickname: '' }));
    setSuccessMessage('');

    if (!validateNickname()) {
      return;
    }

    // 변경 사항 확인은 백엔드에서 처리하므로 여기서는 제거
    // (같은 닉네임일 경우 백엔드에서 "중복되는 닉네임입니다" 에러 반환)

    setIsSubmitting(true);

    try {
      await updateProfile(nickname.trim());

      // Redux 상태 업데이트
      dispatch(fetchUserInfoAsync());

      setSuccessMessage('닉네임이 성공적으로 수정되었습니다!');
    } catch (error) {
      // 에러를 조용히 처리 (콘솔에 로그하지 않음)
      const errorMessage = error.response?.data?.message || error.message || '닉네임 수정에 실패했습니다.';
      setValidationErrors(prev => ({ ...prev, nickname: errorMessage }));
      // 에러를 조용히 처리하기 위해 에러를 다시 throw하지 않음
    } finally {
      setIsSubmitting(false);
    }
  };

  // 카테고리 수정 핸들러
  const handleCategoriesSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors(prev => ({ ...prev, categories: '' }));
    setSuccessMessage('');

    // 관심 카테고리가 비어있어도 허용하도록 유효성 검사 제거 또는 수정
    // if (!validateCategories()) {
    //   return;
    // }

    // 변경 사항 확인 (서버의 영문 카테고리와 비교)
    const currentEnglishCategories = user?.categories || [];
    const newEnglishCategories = convertDisplayNamesToCategories(selectedCategories);
    const categoriesChanged = JSON.stringify([...newEnglishCategories].sort()) !== JSON.stringify([...currentEnglishCategories].sort());

    if (!categoriesChanged) {
      setSuccessMessage('변경 사항이 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 한글 카테고리를 영문으로 변환하여 서버에 전송 (비어있으면 빈 배열 전송)
      const englishCategories = convertDisplayNamesToCategories(selectedCategories);
      await updateCategories(englishCategories);

      // Redux 상태 업데이트
      dispatch(fetchUserInfoAsync());

      setSuccessMessage(selectedCategories.length === 0
        ? '관심 카테고리가 모두 해제되었습니다.'
        : '관심 카테고리가 성공적으로 수정되었습니다!');
    } catch (error) {
      // 에러를 조용히 처리 (콘솔에 로그하지 않음)
      const errorMessage = error.response?.data?.message || error.message || '카테고리 수정에 실패했습니다.';
      setValidationErrors(prev => ({ ...prev, categories: errorMessage }));
      // 에러를 조용히 처리하기 위해 에러를 다시 throw하지 않음
    } finally {
      setIsSubmitting(false);
    }
  };

  // 프로필 이미지 선택 핸들러
  const handleProfileImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileImageMessage('이미지 파일만 업로드 가능합니다.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setProfileImageMessage('프로필 이미지는 10MB 이하여야 합니다.');
      return;
    }

    setProfileImageFile(file);
    setProfileImageMessage('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 프로필 이미지 업로드 핸들러
  const handleProfileImageUpload = async () => {
    if (!profileImageFile) {
      setProfileImageMessage('업로드할 이미지를 선택해주세요.');
      return;
    }
    setIsUploadingProfileImage(true);
    setProfileImageMessage('이미지를 업로드 중입니다...');
    try {
      await uploadProfileImage(profileImageFile);
      // 업로드 완료 후 로컬 상태 정리
      setProfileImageFile(null);
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = '';
      }
      // 사용자 정보 다시 가져오기
      const result = await dispatch(fetchUserInfoAsync());
      // 서버에서 받은 이미지 URL로 즉시 업데이트
      const updatedUser = result.payload || user;
      const serverImageUrl = updatedUser?.profileImageUrl;
      if (serverImageUrl) {
        // 상대 경로인 경우 절대 URL로 변환
        const imageUrl = serverImageUrl.startsWith('http')
          ? serverImageUrl
          : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${serverImageUrl}`;
        setProfileImagePreview(imageUrl);
      }
      setProfileImageMessage('프로필 이미지가 업로드되었습니다.');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '프로필 이미지 업로드에 실패했습니다.';
      setProfileImageMessage(msg);
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  // 프로필 이미지 삭제 핸들러
  const handleProfileImageDelete = async () => {
    setIsUploadingProfileImage(true);
    setProfileImageMessage('프로필 이미지를 삭제 중입니다...');
    try {
      await deleteProfileImage();
      await dispatch(fetchUserInfoAsync());
      setProfileImageFile(null);
      setProfileImagePreview(null);
      if (profileImageInputRef.current) {
        profileImageInputRef.current.value = '';
      }
      setProfileImageMessage('프로필 이미지가 삭제되었습니다.');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '프로필 이미지 삭제에 실패했습니다.';
      setProfileImageMessage(msg);
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  // 취소 핸들러
  const handleCancel = () => {
    navigate('/');
  };

  // 회원탈퇴 핸들러
  const handleDeactivateAccount = async () => {
    // 사용자 확인
    const confirmed = window.confirm('정말로 회원탈퇴 하시겠습니까?\n계정은 비활성화되며 이후 복구가 어려울 수 있습니다.');
    if (!confirmed) {
      return;
    }

    try {
      setIsDeactivating(true);
      // 서버에 계정 비활성(탈퇴) 요청
      await deactivateAccount();

      // 클라이언트 상태 정리 및 로그아웃 처리
      await dispatch(logoutAsync());

      // 탈퇴 완료 후 로그인 페이지로 이동
      alert('회원탈퇴가 완료되었습니다.');
      navigate('/login', { replace: true });
    } catch (error) {
      // 에러는 조용히 처리하고 메시지로만 표시
      const msg =
        error.response?.data?.message ||
        error.message ||
        '회원탈퇴 중 오류가 발생했습니다.';
      setSuccessMessage(msg);
    } finally {
      setIsDeactivating(false);
    }
  };

  // 얼굴 이미지 선택 핸들러
  const handleFaceImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 검증 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        setFaceMessage('이미지 크기는 10MB 이하여야 합니다.');
        return;
      }

      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        setFaceMessage('이미지 파일만 업로드 가능합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFacePreview(reader.result);
        setFaceImage(reader.result);
        setFaceMessage('');
      };
      reader.readAsDataURL(file);
    }
  };

  // 얼굴 등록 핸들러
  const handleRegisterFace = async () => {
    if (!faceImage) {
      setFaceMessage('이미지를 선택해주세요.');
      return;
    }

    if (!user?.email) {
      setFaceMessage('사용자 정보를 불러올 수 없습니다.');
      return;
    }

    setIsRegisteringFace(true);
    setFaceMessage('얼굴을 분석하고 데이터베이스에 저장하는 중...');

    try {
      // Base64 데이터에서 헤더 제거 (이미 data:image/... 형식이므로 그대로 사용)
      const response = await registerFace(
        faceImage,
        user.email, // userId로 email 사용
        user.nickname || user.email // userName
      );

      if (response.success && response.data?.success) {
        setFaceMessage('얼굴 등록이 완료되었습니다! 데이터베이스에 저장되었습니다.');
        // 성공 메시지 표시 후 3초 뒤 초기화
        setTimeout(() => {
          setFaceImage(null);
          setFacePreview(null);
          setFaceMessage('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      } else {
        const errorMsg = response.data?.message || response.message || '얼굴 등록에 실패했습니다.';
        setFaceMessage(errorMsg);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        '얼굴 등록 중 오류가 발생했습니다.';
      setFaceMessage(errorMessage);
    } finally {
      setIsRegisteringFace(false);
    }
  };

  // 얼굴 이미지 초기화
  const handleResetFace = () => {
    setFaceImage(null);
    setFacePreview(null);
    setFaceMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // 카메라가 활성화되어 있으면 종료
    if (isCameraActive) {
      stopCamera();
    }
  };

  // 카메라 시작
  const startCamera = async () => {
    console.log('카메라 시작 함수 호출됨');
    try {
      setCameraError('');
      setFaceMessage('');
      setIsCameraActive(true); // 먼저 활성화하여 로딩 화면 표시
      setIsVideoReady(false);

      // 카메라 지원 여부 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('카메라를 지원하지 않는 브라우저');
        setCameraError('이 브라우저는 카메라를 지원하지 않습니다.');
        // 에러 메시지를 보여주기 위해 isCameraActive는 true로 유지
        return;
      }

      console.log('카메라 권한 요청 중...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // 전면 카메라 우선
        },
        audio: false
      });

      console.log('카메라 스트림 받음:', stream);
      streamRef.current = stream;

      // 비디오 요소가 준비될 때까지 대기
      const setupVideo = () => {
        if (videoRef.current) {
          console.log('비디오 요소에 스트림 할당');
          const video = videoRef.current;
          video.srcObject = stream;
          setIsVideoReady(false);

          // 비디오 로드 및 재생 보장
          let timeoutId = null;

          // 비디오 준비 완료 처리 함수
          const handleVideoReady = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            setIsVideoReady(true);
          };

          // 비디오 메타데이터 로드 완료 시
          video.onloadedmetadata = () => {
            console.log('비디오 메타데이터 로드 완료');
            video.play()
              .then(() => {
                console.log('비디오 재생 시작');
                handleVideoReady();
              })
              .catch(err => {
                console.error('비디오 재생 에러:', err);
                // 재생 실패해도 비디오는 표시
                handleVideoReady();
              });
          };

          // 비디오 재생 시작 이벤트
          video.onplaying = () => {
            console.log('비디오 재생 중');
            handleVideoReady();
          };

          // 비디오 로드 시작 이벤트
          video.onloadstart = () => {
            console.log('비디오 로드 시작');
          };

          // 에러 발생 시에도 비디오 표시 시도
          video.onerror = (err) => {
            console.error('비디오 에러:', err);
            // 에러가 발생해도 일정 시간 후 표시 시도
            setTimeout(() => {
              if (videoRef.current && videoRef.current.srcObject) {
                handleVideoReady();
              }
            }, 1000);
          };

          // 타임아웃 설정: 3초 후에도 준비되지 않으면 강제로 표시
          timeoutId = setTimeout(() => {
            if (videoRef.current && videoRef.current.srcObject) {
              console.log('타임아웃: 비디오 강제 표시');
              handleVideoReady();
            }
          }, 3000);
        } else {
          // 비디오 요소가 아직 준비되지 않았으면 잠시 후 다시 시도
          console.log('비디오 요소가 아직 준비되지 않음, 재시도...');
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
      // 에러 메시지를 보여주기 위해 isCameraActive는 true로 유지
      console.error('카메라 에러 메시지 설정:', errorMessage);
    }
  };

  // 카메라 종료
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
  };

  // 사진 촬영 및 바로 등록
  const capturePhoto = async () => {
    if (!videoRef.current) {
      setFaceMessage('카메라가 준비되지 않았습니다.');
      return;
    }

    const video = videoRef.current;

    // 비디오가 로드되었는지 확인
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setFaceMessage('카메라가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (!user?.email) {
      setFaceMessage('사용자 정보를 불러올 수 없습니다.');
      return;
    }

    // 촬영 중 상태 표시
    setIsRegisteringFace(true);
    setFaceMessage('사진을 촬영하고 등록하는 중...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      // 좌우 반전된 비디오를 원래대로 되돌림
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Canvas를 Base64 이미지로 변환
      const imageData = canvas.toDataURL('image/png');

      // 카메라 종료
      stopCamera();

      // 미리보기 설정
      setFacePreview(imageData);
      setFaceImage(imageData);

      // 바로 얼굴 등록 API 호출 (DB에 저장됨)
      const response = await registerFace(
        imageData,
        user.email, // userId로 email 사용
        user.nickname || user.email // userName
      );

      if (response.success && response.data?.success) {
        setFaceMessage('얼굴 등록이 완료되었습니다! 데이터베이스에 저장되었습니다.');
        // 성공 메시지 표시 후 3초 뒤 초기화
        setTimeout(() => {
          setFaceImage(null);
          setFacePreview(null);
          setFaceMessage('');
        }, 3000);
      } else {
        const errorMsg = response.data?.message || response.message || '얼굴 등록에 실패했습니다.';
        setFaceMessage(errorMsg);
        // 실패 시 이미지는 유지하여 재시도 가능하게 함
      }
    } catch (error) {
      console.error('얼굴 등록 에러:', error);
      const errorMessage = error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        '얼굴 등록 중 오류가 발생했습니다.';
      setFaceMessage(errorMessage);
      // 에러 발생 시에도 이미지는 유지하여 재시도 가능하게 함
    } finally {
      setIsRegisteringFace(false);
    }
  };

  // 카메라 모드 토글
  const handleCameraToggle = () => {
    console.log('카메라 토글 버튼 클릭됨, 현재 상태:', isCameraActive);
    if (isCameraActive) {
      console.log('카메라 종료');
      stopCamera();
    } else {
      console.log('카메라 시작');
      // 기존 이미지가 있으면 초기화
      if (facePreview) {
        setFaceImage(null);
        setFacePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      startCamera();
    }
  };

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    setValidationErrors({ ...validationErrors, nickname: '' });
    setSuccessMessage('');
  };

  // 사이드바 네비게이션 클릭 핸들러 (기능 비활성화 상태)
  const handleNavClick = (menuName) => {
    alert(`${menuName} 기능은 준비 중입니다.`);
  };

  // 비디오가 준비되면 재생 보장
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      const video = videoRef.current;

      // 비디오가 재생 중이 아니면 재생 시도
      if (video.paused && video.readyState >= video.HAVE_METADATA) {
        video.play().catch(err => {
          console.error('비디오 재생 에러:', err);
        });
      }
    }
  }, [isCameraActive, isVideoReady]);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 하단 저장 버튼: 이미지/닉네임/카테고리 중 변경된 항목만 저장
  const handleSaveAll = async () => {
    setSuccessMessage('');
    setProfileImageMessage('');

    const baseNickname = user?.nickname || '';
    const baseCategories = user?.categories || []; // 서버에서 받은 영문 카테고리

    const nicknameTrimmed = nickname.trim();
    const nicknameChanged = !!user && nicknameTrimmed !== baseNickname;
    // 한글 카테고리를 영문으로 변환하여 서버의 영문 카테고리와 비교
    const newEnglishCategories = convertDisplayNamesToCategories(selectedCategories);
    const categoriesChanged =
      !!user &&
      JSON.stringify([...newEnglishCategories].sort()) !==
      JSON.stringify([...baseCategories].sort());
    const imageChanged = !!profileImageFile;

    if (!nicknameChanged && !categoriesChanged && !imageChanged) {
      alert('변경 사항이 없습니다.');
      return;
    }

    // 닉네임/카테고리 유효성 검사
    if (nicknameChanged && !validateNickname()) {
      return;
    }
    // 카테고리 변경 시 유효성 검사 (0개여도 허용하므로 validateCategories 호출 대신 직접 체크하거나 생략)
    // if (categoriesChanged && !validateCategories()) {
    //   return;
    // }

    // 변경된 항목 목록 생성
    const changedItems = [];
    if (nicknameChanged) {
      changedItems.push('닉네임');
    }
    if (categoriesChanged) {
      changedItems.push('관심 카테고리');
    }
    if (imageChanged) {
      changedItems.push('프로필 이미지');
    }

    // 변경된 항목 알림
    const changedItemsText = changedItems.join(', ');
    alert(`다음 항목이 수정되었습니다:\n${changedItemsText}`);

    setIsSubmitting(true);

    try {
      // 닉네임 변경
      if (nicknameChanged) {
        await updateProfile(nicknameTrimmed);
      }

      // 카테고리 변경
      if (categoriesChanged) {
        // 한글 카테고리를 영문으로 변환하여 서버에 전송
        const englishCategories = convertDisplayNamesToCategories(selectedCategories);
        await updateCategories(englishCategories);
      }

      // 프로필 이미지 변경
      if (imageChanged) {
        await uploadProfileImage(profileImageFile);
        // 업로드 완료 후 로컬 상태 정리
        setProfileImageFile(null);
        if (profileImageInputRef.current) {
          profileImageInputRef.current.value = '';
        }
        setProfileImageMessage('프로필 이미지가 업로드되었습니다.');
      }

      // 사용자 정보 다시 가져오기
      const result = await dispatch(fetchUserInfoAsync());

      // 프로필 이미지 업로드 후 서버에서 받은 이미지 URL로 즉시 업데이트
      if (imageChanged) {
        const updatedUser = result.payload || user;
        const serverImageUrl = updatedUser?.profileImageUrl;
        if (serverImageUrl) {
          // 상대 경로인 경우 절대 URL로 변환
          const imageUrl = serverImageUrl.startsWith('http')
            ? serverImageUrl
            : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${serverImageUrl}`;
          setProfileImagePreview(imageUrl);
        }
      }

      // 성공 메시지
      const successItems = [];
      if (nicknameChanged) successItems.push('닉네임');
      if (categoriesChanged) successItems.push('관심 카테고리');
      if (imageChanged) successItems.push('프로필 이미지');

      const successMessage = `${successItems.join(', ')}이(가) 성공적으로 저장되었습니다!`;
      setSuccessMessage(successMessage);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        '프로필 저장 중 오류가 발생했습니다.';
      setSuccessMessage('');
      setProfileImageMessage(msg);
      alert(`저장 중 오류가 발생했습니다:\n${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* 좌측 사이드바 영역 */}
          <aside className="w-full lg:w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:sticky lg:top-8 lg:h-fit">
            <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden mb-4 border-2 border-gray-200 shadow-sm">
                <img
                  src={profileImagePreview || '/default-profile.png'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1 text-center">{nickname || '여기는 닉네임'}</h3>
              <p className="text-xs lg:text-sm text-gray-500 text-center">{user?.username || user?.email?.split('@')[0] || 'user_id'}</p>
            </div>

            <nav className="space-y-1">
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-lg bg-blue-50 text-blue-600 font-medium transition-colors cursor-default"
                disabled
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">내 계정</span>
              </button>
              <button
                onClick={() => handleNavClick('인증')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">인증</span>
              </button>
              <button
                onClick={() => handleNavClick('결제 수단')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="text-sm">결제 수단</span>
              </button>
              <button
                onClick={() => handleNavClick('알림')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-sm">알림</span>
              </button>
              <button
                onClick={() => handleNavClick('차단')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left rounded-lg text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className="text-sm">차단</span>
              </button>
            </nav>
          </aside>

          {/* 우측 메인 콘텐츠 영역 */}
          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">내 계정</h2>
              <p className="text-sm text-gray-500">계정 정보와 프로필을 관리할 수 있습니다</p>
            </div>

            {/* 실제 입력 폼들 */}
            <ProfileEditForm
              user={user}
              nickname={nickname}
              onNicknameChange={handleNicknameChange}
              onNicknameSubmit={handleNicknameSubmit}
              selectedCategories={selectedCategories}
              availableCategories={availableCategories}
              onCategoryToggle={handleCategoryToggle}
              onCategoriesSubmit={handleCategoriesSubmit}
              validationErrors={validationErrors}
              successMessage={successMessage}
              isSubmitting={isSubmitting}
              isDeactivating={isDeactivating}
              onDeactivateAccount={handleDeactivateAccount}
              isAutoGeneratedNickname={isAutoGeneratedNickname}
              onSaveAll={handleSaveAll}
              onCancel={handleCancel}
              isLoading={isLoading}
              profileImagePreview={profileImagePreview}
              profileImageMessage={profileImageMessage}
              isUploadingProfileImage={isUploadingProfileImage}
              onProfileImageSelect={handleProfileImageSelect}
              profileImageInputRef={profileImageInputRef}
              onProfileImageUpload={handleProfileImageUpload}
              onProfileImageDelete={handleProfileImageDelete}
              isCameraActive={isCameraActive}
              isVideoReady={isVideoReady}
              cameraError={cameraError}
              isRegisteringFace={isRegisteringFace}
              facePreview={facePreview}
              faceMessage={faceMessage}
              videoRef={videoRef}
              fileInputRef={fileInputRef}
              onCameraToggle={handleCameraToggle}
              onFaceImageSelect={handleFaceImageSelect}
              onCapturePhoto={capturePhoto}
              onStopCamera={stopCamera}
              onRegisterFace={handleRegisterFace}
              onResetFace={handleResetFace}
            />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;