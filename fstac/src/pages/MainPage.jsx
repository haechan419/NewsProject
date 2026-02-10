<<<<<<< HEAD
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getMyCategories, getCategoryDisplayName } from '@/api/categoryApi';
import { getNewsByCategory } from '@/api/userCategoryNewsApi';
import { exchangeRateApi } from '@/api/exchangeRateApi';
=======
import React, { useState } from 'react';
import TopBar from '../layouts/TopBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163

const MainPage = () => {
  // 캐러셀 상태
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  // 새로운 소식 탭 상태
  const [newsTab, setNewsTab] = useState('전체');

  // 보도자료 탭 상태
  const [pressTab, setPressTab] = useState('전체');

  // 새로운 소식 페이지네이션
  const [newsPage, setNewsPage] = useState(1);
  const totalNewsPages = 2;

<<<<<<< HEAD
  // 로딩 상태
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // 무한 스크롤 관련 상태
  const newsContainerRef = useRef(null);
  const videoAreaRef = useRef(null);
  const sidebarRef = useRef(null);
  const [sidebarHeight, setSidebarHeight] = useState('auto');

  // 메인 비디오 캐러셀 관련 상태
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoLoadErrors, setVideoLoadErrors] = useState({});
  const [videoLoaded, setVideoLoaded] = useState({});
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const fullscreenVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);

  // 카테고리별 비디오 데이터
  const videoCategories = ['politics', 'economy', 'culture', 'it', 'society', 'world'];
  const videoData = {
    politics: {
      title: '정치 뉴스',
      content: '최신 정치 동향과 정책 변화를 확인하세요',
      color: '#1e40af',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    economy: {
      title: '경제 뉴스',
      content: '시장 동향과 경제 지표를 실시간으로 확인하세요',
      color: '#059669',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    culture: {
      title: '문화 뉴스',
      content: '다양한 문화 소식과 이벤트를 만나보세요',
      color: '#7c3aed',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    it: {
      title: 'IT/과학 뉴스',
      content: '최신 기술 트렌드와 과학 뉴스를 확인하세요',
      color: '#dc2626',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    },
    society: {
      title: '사회 뉴스',
      content: '사회 이슈와 사람들의 이야기를 전합니다',
      color: '#ea580c',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    },
    world: {
      title: '국제 뉴스',
      content: '전 세계 주요 뉴스와 국제 정세를 파악하세요',
      color: '#0891b2',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
=======
  // 캐러셀 데이터
  const carouselData = [
    {
      title: '물음표에서 시작된 빛 스스로 만든 느낌표가 되다',
      id: 1
    },
    {
      title: '두 번째 슬라이드 제목',
      id: 2
    },
    {
      title: '세 번째 슬라이드 제목',
      id: 3
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    }
  ];

<<<<<<< HEAD
  // 썸네일 카테고리 (메인 비디오 제외한 5개)
  const thumbnailCategories = useMemo(() => {
    return videoCategories.filter((_, index) => index !== currentVideoIndex).slice(0, 5);
  }, [currentVideoIndex]);

  // 특정 카테고리의 뉴스만 가져오는 함수 (초기 로드) - 최대 10개만
  const fetchNewsByCategory = useCallback(async (category, reset = true) => {
    if (!category) return;

    try {
      if (reset) {
        setIsLoadingNews(true);
      }

      // 카테고리별 최대 10개만 가져오기
      const limit = 10;

      console.log(`[DEBUG] 카테고리 조회 시작: category="${category}", limit=${limit}`);
      const newsData = await getNewsByCategory(category, limit);
      console.log(`[DEBUG] 서버 응답 데이터:`, newsData);

      if (newsData) {
        // 최대 10개만 표시
        const limitedNews = (newsData || []).slice(0, 10);

        if (reset) {
          setBriefingNews(limitedNews);
        }

        console.log(`카테고리 "${category}" (${getCategoryDisplayName(category)}) 뉴스 조회 완료:`, limitedNews.length, '개');
        if (limitedNews.length === 0 && reset) {
          console.warn(`[경고] 카테고리 "${category}"에 대한 뉴스가 없습니다.`);
        }
      }
    } catch (error) {
      console.error(`카테고리 "${category}" 뉴스 조회 실패:`, error);
    } finally {
      setIsLoadingNews(false);
=======
  // 새로운 소식 데이터
  const newsData = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=400&h=200&fit=crop',
      title: '2026 군사력 랭킹 나왔다 \'NO 핵\' 한국 세계 5위',
      subtitle: '[영상] 핵무기 없는 한국 \'군사력 파워\' 3년 연속 세계 5위…북한 31위',
      duration: '02:47'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=200&fit=crop',
      title: '숨진 주인 옆에서 4일 인도가 울었다',
      subtitle: '[영상] 눈보라에 갇혀 숨진 주인...나흘 동안 곁 지킨 반려견',
      duration: '01:48'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
      title: '마트주차장에 \'시민 어벤져스\' 119보다 빨랐다!',
      subtitle: '[영상] "차 밑에 사람이 깔렸어요"...여기저기서 우르르 달려와 \'번쩍\'',
      duration: '02:02'
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    }
  ];

<<<<<<< HEAD

  // 비디오 네비게이션 함수
  const goToVideo = (index) => {
    setCurrentVideoIndex(index);
  };

  // 비디오가 끝나면 다음 비디오로 전환
  const handleVideoEnded = useCallback(() => {
    setCurrentVideoIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % videoCategories.length;
      return nextIndex;
    });
  }, [videoCategories.length]);

  // 메인 이미지 영역 높이에 맞춰 관심 보도자료 영역 높이 조정
  useEffect(() => {
    const updateSidebarHeight = () => {
      if (videoAreaRef.current && sidebarRef.current) {
        // 데스크톱에서만 높이 고정
        if (window.innerWidth >= 1024) {
          const imageHeight = videoAreaRef.current.offsetHeight;
          setSidebarHeight(`${imageHeight}px`);
        } else {
          setSidebarHeight('auto');
        }
      }
    };

    // 초기 높이 설정
    updateSidebarHeight();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', updateSidebarHeight);

    // 짧은 지연 후 다시 확인 (레이아웃 완료 후)
    const timer = setTimeout(updateSidebarHeight, 100);

    return () => {
      window.removeEventListener('resize', updateSidebarHeight);
      clearTimeout(timer);
    };
  }, []);


  // 활성화된 비디오 재생 및 볼륨 설정
  useEffect(() => {
    const videoElements = document.querySelectorAll('.video-carousel-item');
    videoElements.forEach((video, index) => {
      if (index === currentVideoIndex) {
        const videoEl = video.querySelector('video');
        if (videoEl) {
          videoEl.volume = volume;
          videoEl.muted = isMuted;
          // 비디오가 끝나면 자동으로 다음으로 전환되도록 설정
          videoEl.onended = handleVideoEnded;
          videoEl.play().catch(err => {
            console.log('비디오 자동 재생 실패:', err);
          });
        }
      } else {
        const videoEl = video.querySelector('video');
        if (videoEl) {
          videoEl.pause();
          videoEl.currentTime = 0; // 다른 비디오는 처음으로 되돌림
        }
      }
    });
  }, [currentVideoIndex, volume, isMuted, handleVideoEnded]);

  const goToPreviousVideo = () => {
    const prevIndex = (currentVideoIndex - 1 + videoCategories.length) % videoCategories.length;
    goToVideo(prevIndex);
  };

  const goToNextVideo = () => {
    const nextIndex = (currentVideoIndex + 1) % videoCategories.length;
    goToVideo(nextIndex);
  };

  // 썸네일 클릭 핸들러
  const handleThumbnailClick = (category) => {
    const index = videoCategories.indexOf(category);
    if (index !== -1) {
      goToVideo(index);
    }
  };

  // 전체화면 모달 열기
  const openFullscreenModal = () => {
    setIsFullscreenModalOpen(true);
  };

  // 전체화면 모달 닫기
  const closeFullscreenModal = () => {
    setIsFullscreenModalOpen(false);
    // 비디오 일시정지
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.pause();
    }
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreenModalOpen) {
        closeFullscreenModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreenModalOpen]);

  // 사용자 관심 카테고리 및 뉴스 데이터 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingNews(true);

        // 사용자 관심 카테고리 조회
        const categories = await getMyCategories();
        setUserCategories(categories || []);

        // 첫 번째 카테고리를 기본 선택하고 10개 제한으로 데이터 가져오기
        if (categories && categories.length > 0) {
          const firstCategory = categories[0];
          setSelectedCategory(firstCategory);
          console.log('선택된 카테고리:', firstCategory);
          console.log('사용자 관심 카테고리:', categories);

          // 첫 번째 카테고리의 뉴스 10개만 가져오기
          const newsData = await getNewsByCategory(firstCategory, 10);
          if (newsData) {
            const limitedNews = (newsData || []).slice(0, 10);
            setBriefingNews(limitedNews);
            console.log('받아온 뉴스 데이터:', limitedNews);
          }
        }
      } catch (error) {
        console.error('사용자 데이터 조회 실패:', error);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchUserData();
  }, []);

  // 환율 데이터 상태
  const [exchangeRates, setExchangeRates] = useState([]);
  const [isLoadingExchangeRates, setIsLoadingExchangeRates] = useState(true);

  // 환율 데이터 가져오기
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setIsLoadingExchangeRates(true);
        console.log('[환율] API 호출 시작');
        const response = await exchangeRateApi.getAllExchangeRates();
        console.log('[환율] API 응답:', response);

        if (response && response.exchangeRates && Array.isArray(response.exchangeRates)) {
          console.log('[환율] 환율 데이터 개수:', response.exchangeRates.length);
          setExchangeRates(response.exchangeRates);
        } else {
          console.warn('[환율] 응답 구조가 올바르지 않습니다:', response);
          setExchangeRates([]);
        }
      } catch (error) {
        console.error('[환율] 데이터 조회 실패:', error);
        console.error('[환율] 에러 상세:', error.response?.data || error.message);
        setExchangeRates([]);
      } finally {
        setIsLoadingExchangeRates(false);
      }
    };

    // 초기 데이터 로드
    fetchExchangeRates();

    // 10분마다 데이터 갱신 (캐시 TTL에 맞춤)
    const interval = setInterval(fetchExchangeRates, 600000);

    return () => clearInterval(interval);
  }, []);

  // 숫자 포맷팅 함수
  const formatNumber = (num) => {
    if (num == null) return '0';
    return typeof num === 'number'
      ? num.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : parseFloat(num).toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 주요 통화 필터링 (USD, JPY, EUR, CNY, GBP 등)
  const majorCurrencies = useMemo(() => {
    const majorCodes = ['USD', 'JPY', 'EUR', 'CNY', 'GBP', 'CNH'];
    return exchangeRates.filter(rate => {
      if (!rate.curUnit) return false;
      const code = rate.curUnit.toUpperCase().split('(')[0].trim();
      return majorCodes.includes(code);
    });
  }, [exchangeRates]);
=======
  // 보도자료 데이터
  const pressReleases = [
    { id: 1, title: '처인구 신규 사업 발표', time: '2시간 전', duration: '00:50', thumbnail: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=100&h=100&fit=crop' },
    { id: 2, title: '기흥구 문화 행사 개최', time: '3시간 전', duration: '02:27', thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop' },
    { id: 3, title: '수지구 도로 공사 완료', time: '4시간 전', duration: '03:06', thumbnail: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop' },
    { id: 4, title: '처인구 환경 정책 발표', time: '5시간 전', duration: '02:04', thumbnail: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=100&h=100&fit=crop' },
    { id: 5, title: '기흥구 주민 참여 프로그램', time: '6시간 전', duration: '01:30', thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop' },
    { id: 6, title: '수지구 복지 서비스 확대', time: '7시간 전', duration: '02:15', thumbnail: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop' },
    { id: 7, title: '처인구 교통 개선 계획', time: '8시간 전', duration: '01:45', thumbnail: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=100&h=100&fit=crop' },
    { id: 8, title: '기흥구 스마트시티 구축', time: '9시간 전', duration: '03:20', thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop' },
    { id: 9, title: '수지구 교육 시설 개선', time: '10시간 전', duration: '02:50', thumbnail: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop' }
  ];

  // 경제 데이터
  const economicData = {
    chosun: { value: '936.13', change: '-6.47' },
    yuan: { value: '205.81', change: '-1.62' },
    kospi: { value: '5,170.81', change: '+85.96' },
    kosdaq: { value: '1,133.52', change: '+50.93' },
    kospi200: { value: '758.72', change: '+13.59' },
    dollar: { value: '2026.01.28 장마감', change: '' }
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const handlePrevNewsPage = () => {
    setNewsPage((prev) => (prev === 1 ? totalNewsPages : prev - 1));
  };

  const handleNextNewsPage = () => {
    setNewsPage((prev) => (prev === totalNewsPages ? 1 : prev + 1));
  };
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163

  return (
    <div className="min-h-screen bg-white">
      <TopBar />

<<<<<<< HEAD
      {/* 경제 데이터 */}
      <section className="bg-white border-y border-gray-200 py-3 sm:py-4 px-2 sm:px-4 md:px-8 overflow-hidden mt-16 sm:mt-20">
        <div className="max-w-7xl mx-auto relative">
          {isLoadingExchangeRates ? (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <span>환율 데이터를 불러오는 중...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 bg-white z-10 pr-2 sm:pr-4 whitespace-nowrap text-[10px] sm:text-xs">경제 &gt;</span>
              <div className="flex-1 overflow-hidden relative h-5 sm:h-6">
                {majorCurrencies.length > 0 ? (
                  <div className="marquee-wrapper">
                    <div className="marquee-track">
                      {/* 첫 번째 세트 */}
                      {majorCurrencies.map((rate, index) => {
                        const code = rate.curUnit?.toUpperCase().split('(')[0].trim() || '';
                        const displayName = code === 'CNH' ? '위안(CNY)' : code;
                        return (
                          <div key={`first-${index}`} className="marquee-item">
                            <span className="text-gray-700 text-[10px] sm:text-xs">{displayName}</span>
                            <span className="font-medium text-[10px] sm:text-xs text-gray-900">
                              {formatNumber(rate.dealBasR)}
                            </span>
                          </div>
                        );
                      })}
                      {/* 무한 루프를 위한 두 번째 동일 세트 */}
                      {majorCurrencies.map((rate, index) => {
                        const code = rate.curUnit?.toUpperCase().split('(')[0].trim() || '';
                        const displayName = code === 'CNH' ? '위안(CNY)' : code;
                        return (
                          <div key={`second-${index}`} className="marquee-item" aria-hidden="true">
                            <span className="text-gray-700 text-[10px] sm:text-xs">{displayName}</span>
                            <span className="font-medium text-[10px] sm:text-xs text-gray-900">
                              {formatNumber(rate.dealBasR)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center text-xs sm:text-sm text-gray-500">
                    <span>환율 데이터가 없습니다</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <style>{`
          .marquee-wrapper {
            width: 100%;
            overflow: hidden;
            position: relative;
          }
          .marquee-track {
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: marquee-scroll 25s linear infinite;
            will-change: transform;
            white-space: nowrap;
          }
          @media (min-width: 640px) {
            .marquee-track {
              gap: 1.5rem;
            }
          }
          @media (min-width: 768px) {
            .marquee-track {
              gap: 2rem;
            }
          }
          .marquee-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            flex-shrink: 0;
          }
          @keyframes marquee-scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* 메인 콘텐츠 & 관심 보도자료 섹션 */}
      <section className="bg-white py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-8">
        <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:items-start">
          {/* 왼쪽: 메인 비디오 영역 */}
          <div ref={videoAreaRef} className="relative w-full">
            {/* 메인 비디오 */}
            <div
              className="relative overflow-hidden rounded-lg bg-gray-100 border border-gray-200 aspect-[16/9] sm:aspect-[21/9] cursor-pointer"
              onClick={openFullscreenModal}
            >
              {/* 카테고리 라벨 (위쪽) */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1.5 bg-black/70 text-white text-sm font-medium rounded">
                  {getCategoryDisplayName(videoCategories[currentVideoIndex])}
                </span>
              </div>

              {/* 재생 아이콘 오버레이 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <div className="bg-black/50 rounded-full p-4 hover:bg-black/70 transition-all">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {/* 볼륨 컨트롤 - 재생 버튼 아래 */}
                <div className="mt-4 flex items-center gap-2 pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                    aria-label={isMuted ? "음소거 해제" : "음소거"}
                  >
                    {isMuted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    )}
                  </button>
                  {!isMuted && (
                    <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => {
                          setVolume(parseFloat(e.target.value));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 h-1 bg-white/50 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, white 0%, white ${volume * 100}%, rgba(255,255,255,0.5) ${volume * 100}%, rgba(255,255,255,0.5) 100%)`
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 메인 비디오 */}
              {videoCategories.map((category, index) => {
                const video = videoData[category];
                const isActive = currentVideoIndex === index;
                const hasError = videoLoadErrors[category];
                const isLoaded = videoLoaded[category];

                return (
                  <div
                    key={category}
                    className={`video-carousel-item absolute inset-0 transition-opacity duration-500 ${isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0'}`}
                  >
                    {/* 비디오 플레이어 */}
                    <video
                      className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      onLoadedData={(e) => {
                        const videoEl = e.target;
                        videoEl.volume = volume;
                        videoEl.muted = isMuted;
                        setVideoLoaded(prev => ({ ...prev, [category]: true }));
                      }}
                      onCanPlay={(e) => {
                        const videoEl = e.target;
                        videoEl.volume = volume;
                        videoEl.muted = isMuted;
                        setVideoLoaded(prev => ({ ...prev, [category]: true }));
                      }}
                      onEnded={isActive ? handleVideoEnded : undefined}
                      autoPlay={isActive}
                      onError={(e) => {
                        console.error('비디오 로드 실패:', category, e);
                        setVideoLoadErrors(prev => ({ ...prev, [category]: true }));
                      }}
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* 비디오 플레이스홀더 (비디오 로드 실패 시에만 표시) */}
                    {hasError && (
                      <div
                        className="absolute inset-0 flex items-center justify-center z-[2]"
                        style={{ backgroundColor: video.color }}
                      >
                        <div className="text-center text-white px-2">
                          <p className="text-lg font-medium">{getCategoryDisplayName(category)}</p>
                        </div>
                      </div>
                    )}

                    {/* 로딩 중 표시 */}
                    {isActive && !isLoaded && !hasError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[3]">
                        <div className="text-white text-center px-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p className="text-sm">영상 로딩 중...</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 왼쪽 화살표 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPreviousVideo();
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all z-10 shadow-md"
                aria-label="이전 비디오"
=======
      {/* 메인 배너/캐러셀 */}
      <section className="bg-gray-800 text-white py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-300">그룹소개</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="relative">
            <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
              {carouselData[currentSlide].title}
            </h1>

            {/* 캐러셀 네비게이션 */}
            <div className="flex items-center gap-4">
              <span className={`text-lg ${currentSlide === 0 ? 'font-bold' : 'text-gray-400'}`}>
                {String(currentSlide + 1).padStart(2, '0')}
              </span>
              <div className="h-px w-8 bg-gray-600"></div>
              <span className={`text-lg ${currentSlide === 2 ? 'font-bold' : 'text-gray-400'}`}>
                {String(totalSlides).padStart(2, '0')}
              </span>
              <button
                onClick={handlePrevSlide}
                className="ml-4 p-2 hover:bg-gray-700 rounded transition-colors"
                aria-label="이전 슬라이드"
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* 오른쪽 화살표 버튼 */}
              <button
<<<<<<< HEAD
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextVideo();
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all z-10 shadow-md"
                aria-label="다음 비디오"
=======
                onClick={handleNextSlide}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                aria-label="다음 슬라이드"
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>


              {/* 비디오 제목과 내용 오버레이 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 sm:p-6 z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {videoData[videoCategories[currentVideoIndex]]?.title || '뉴스'}
                </h2>
                <p className="text-sm sm:text-base text-white/90">
                  {videoData[videoCategories[currentVideoIndex]]?.content || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
            {/* 썸네일 네비게이션 */}
            <div className="mt-3 sm:mt-4 flex justify-between gap-2 sm:gap-3 pb-2">
              {thumbnailCategories.map((category) => {
                const video = videoData[category];
                return (
                  <button
                    key={category}
                    onClick={() => handleThumbnailClick(category)}
                    className="flex-1 relative aspect-video rounded overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all group min-w-0"
                    style={{ backgroundColor: video.color }}
                  >
                    {/* 썸네일 비디오 */}
                    <video
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onMouseEnter={(e) => {
                        e.target.play().catch(() => { });
                      }}
                      onMouseLeave={(e) => {
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                      onError={(e) => {
                        e.target.classList.add('hidden');
                      }}
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <span className="text-white text-xs font-medium truncate block">{getCategoryDisplayName(category)}</span>
                    </div>
                  </button>
                );
              })}
=======
      {/* 새로운 소식 섹션 */}
      <section className="bg-gray-100 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">새로운 소식</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{newsPage}/{totalNewsPages}</span>
              <button
                onClick={handlePrevNewsPage}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="이전 페이지"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextNewsPage}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="다음 페이지"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-4 mb-6">
            {['전체', '처인구', '기흥구', '수지구'].map((tab) => (
              <button
                key={tab}
                onClick={() => setNewsTab(tab)}
                className={`px-4 py-2 rounded transition-colors ${newsTab === tab
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 뉴스 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {newsData.map((news) => (
              <Card key={news.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    연합뉴스
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {news.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{news.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{news.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 경제 데이터 */}
      <section className="bg-white border-y border-gray-200 py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="font-semibold text-gray-900">조선경제 &gt;</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{economicData.chosun.value}</span>
              <span className="text-red-600">{economicData.chosun.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">위안(CNY)</span>
              <span className="text-gray-900">{economicData.yuan.value}</span>
              <span className="text-red-600">{economicData.yuan.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">코스피</span>
              <span className="text-gray-900">{economicData.kospi.value}</span>
              <span className="text-green-600">{economicData.kospi.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">코스닥</span>
              <span className="text-gray-900">{economicData.kosdaq.value}</span>
              <span className="text-green-600">{economicData.kosdaq.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">코스피200</span>
              <span className="text-gray-900">{economicData.kospi200.value}</span>
              <span className="text-green-600">{economicData.kospi200.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">달러</span>
              <span className="text-gray-900">{economicData.dollar.value}</span>
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* 전체화면 비디오 모달 */}
      {isFullscreenModalOpen && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={closeFullscreenModal}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={closeFullscreenModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 rounded-full p-2"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 비디오 컨테이너 */}
          <div
            className="w-full h-full max-w-7xl mx-auto p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={fullscreenVideoRef}
              className="w-full h-full max-h-[90vh] object-contain"
              controls
              autoPlay
              src={videoData[videoCategories[currentVideoIndex]]?.videoUrl}
            >
              <source src={videoData[videoCategories[currentVideoIndex]]?.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* 비디오 정보 */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {videoData[videoCategories[currentVideoIndex]]?.title || '뉴스'}
            </h2>
            <p className="text-base sm:text-lg text-white/90">
              {videoData[videoCategories[currentVideoIndex]]?.content || ''}
            </p>
          </div>
        </div>
      )}
=======
      {/* 보도자료 및 사이드바 섹션 */}
      <section className="bg-gray-100 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 보도자료 섹션 (왼쪽 2/3) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">보도자료</h2>
              <div className="flex gap-2">
                {['전체', '처인구', '다'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPressTab(tab)}
                    className={`px-4 py-2 rounded transition-colors ${pressTab === tab
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 보도자료 리스트 (3열 그리드) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pressReleases.map((release) => (
                <div
                  key={release.id}
                  className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{release.title}</h3>
                      <p className="text-xs text-gray-500">{release.time}</p>
                    </div>
                    <div className="relative shrink-0">
                      <img
                        src={release.thumbnail}
                        alt={release.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                        {release.duration}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 사이드바 (오른쪽 1/3) */}
          <div className="lg:col-span-1">
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">새로운 소식</h3>
                <p className="text-sm text-gray-600 mb-6">
                  구독서비스에 대한 설명입니다
                </p>
                <Button className="w-full">버튼</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 채널 링크 */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            {['유튜브 채널', '연합뉴스', 'K-Culture NOW', '통동테크', '더건강', 'KOREA NOW', 'NK NOW', 'K-VIBE'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* 연합뉴스 정보 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-gray-900">연합뉴스</div>
              <div className="text-xs text-gray-600">
                주소: 서울특별시 중구 세종대로 124 | 전화: 02-398-3000 | 등록번호: 서울 아 00001 | 사업자등록번호: 000-00-00000 |{' '}
                <a href="#" className="text-blue-600 hover:underline">개인정보처리방침</a>
              </div>
            </div>

            {/* 소셜 미디어 및 패밀리 사이트 */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="YouTube">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Family site</span>
                <button className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  <span>+</span>
                </button>
              </div>
            </div>
          </div>

          {/* 저작권 */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            ©2026 Yonhapnews Agency
          </div>
        </div>
      </footer>
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
    </div>
  );
};

export default MainPage;
