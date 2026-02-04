import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getMyCategories, getCategoryDisplayName } from '@/api/categoryApi';
import { getNewsByCategory } from '@/api/userCategoryNewsApi';
import { exchangeRateApi } from '@/api/exchangeRateApi';

const MainPage = () => {

    // 보도자료 탭 상태 (사용자 관심 카테고리)
    const [selectedCategory, setSelectedCategory] = useState(null);

    // 사용자 관심 카테고리 목록
    const [userCategories, setUserCategories] = useState([]);

    // 사용자 관심 카테고리별 뉴스 데이터 (BriefingResponseDTO)
    const [briefingNews, setBriefingNews] = useState([]);

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
        }
    };

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
        }
    }, []);


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

    return (
        <div className="min-h-screen bg-white">

            {/* 경제 데이터 */}
            <section className="bg-white border-y border-gray-200 py-3 sm:py-4 overflow-hidden mt-16 sm:mt-20">
                <div className="mx-auto relative px-[100px]">
                    {isLoadingExchangeRates ? (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <span>환율 데이터를 불러오는 중...</span>
                        </div>
                    ) : (
                        <div className="flex items-center">
        <span className="font-semibold text-gray-900 bg-white z-10 pr-2 sm:pr-4 whitespace-nowrap text-[10px] sm:text-xs">
          경제 &gt;
        </span>
                            <div className="flex-1 overflow-hidden relative h-5 sm:h-6">
                                {majorCurrencies.length > 0 ? (
                                    <div className="marquee-wrapper">
                                        <div className="marquee-track">
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
      .marquee-track { gap: 1.5rem; }
    }
    @media (min-width: 768px) {
      .marquee-track { gap: 2rem; }
    }
    .marquee-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }
    @keyframes marquee-scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .marquee-track:hover {
      animation-play-state: paused;
    }
  `}</style>
            </section>


            {/* 메인 콘텐츠 & 관심 보도자료 섹션 */}
            <section className="bg-white py-4 sm:py-6 md:py-8">
                <div className="mx-auto px-[100px] grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:items-start">
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
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {/* 오른쪽 화살표 버튼 */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToNextVideo();
                                }}
                                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full transition-all z-10 shadow-md"
                                aria-label="다음 비디오"
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
                        </div>
                    </div>

                    {/* 오른쪽: 관심 보도자료 사이드바 */}
                    <div ref={sidebarRef} className="bg-white rounded-lg flex flex-col min-h-0 lg:sticky lg:top-4" style={{ height: sidebarHeight }}>
                        <div className="flex flex-col h-full min-h-0">
                            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200 flex-shrink-0">
                                <h2 className="text-base sm:text-lg font-bold text-gray-900">관심 보도자료</h2>
                            </div>

                            {/* 카테고리 탭 */}
                            <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
                                {userCategories.length > 0 ? (
                                    userCategories.map((category) => (
                                        <button
                                            key={category}
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                fetchNewsByCategory(category, true);
                                            }}
                                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                                ? 'bg-gray-800 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {getCategoryDisplayName(category)}
                                        </button>
                                    ))
                                ) : (
                                    <span className="text-xs sm:text-sm text-gray-500">관심 카테고리를 선택해주세요</span>
                                )}
                            </div>

                            {/* 뉴스 리스트 - 무한 스크롤 적용 */}
                            {isLoadingNews ? (
                                <div className="flex items-center justify-center py-12 flex-1">
                                    <span className="text-gray-500 text-sm">뉴스를 불러오는 중...</span>
                                </div>
                            ) : (
                                <div
                                    ref={newsContainerRef}
                                    className="space-y-2 sm:space-y-3 overflow-y-auto flex-1 min-h-0 pr-2"
                                >
                                    {selectedCategory ? (
                                        briefingNews.length > 0 ? (
                                            <>
                                                {briefingNews.map((news) => {
                                                    // 더미 이미지 URL (이미지가 없을 경우 사용)
                                                    const dummyImageUrl = `https://via.placeholder.com/120x80/4B5563/FFFFFF?text=${encodeURIComponent(news.category || 'News')}`;
                                                    const imageUrl = news.imageUrl || news.thumbnailUrl || dummyImageUrl;

                                                    return (
                                                        <div
                                                            key={news.id}
                                                            className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group bg-white"
                                                            onClick={() => {
                                                                if (news.originalUrl) {
                                                                    window.open(news.originalUrl, '_blank');
                                                                }
                                                            }}
                                                        >
                                                            {/* 이미지 영역 */}
                                                            <div className="flex-shrink-0 w-24 h-20 sm:w-28 sm:h-24 rounded overflow-hidden bg-gray-100">
                                                                <img
                                                                    src={imageUrl}
                                                                    alt={news.title || '뉴스 이미지'}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                    onError={(e) => {
                                                                        // 이미지 로드 실패 시 더미 이미지로 대체
                                                                        e.target.src = dummyImageUrl;
                                                                    }}
                                                                />
                                                            </div>

                                                            {/* 텍스트 영역 */}
                                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                                <div>
                                                                    <h3 className="font-semibold text-sm sm:text-base mb-1.5 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                                                                        {news.title}
                                                                    </h3>
                                                                    {news.summary && (
                                                                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 leading-relaxed">
                                                                            {news.summary.replace(/\[서론\]|\[본론\]|\[결론\]/g, '').trim()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {news.date && (
                                                                    <p className="text-[10px] sm:text-xs text-gray-400 mt-auto">
                                                                        {(() => {
                                                                            try {
                                                                                const date = new Date(news.date);
                                                                                if (isNaN(date.getTime())) return '';
                                                                                return date.toLocaleDateString('ko-KR', {
                                                                                    year: 'numeric',
                                                                                    month: 'short',
                                                                                    day: 'numeric'
                                                                                });
                                                                            } catch {
                                                                                return news.date;
                                                                            }
                                                                        })()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {briefingNews.length >= 10 && (
                                                    <div className="flex items-center justify-center py-4">
                                                        <span className="text-gray-400 text-xs sm:text-sm">카테고리별 최대 10개까지 표시됩니다</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center py-12 text-gray-500 text-sm">
                                                해당 카테고리의 뉴스가 없습니다
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center py-12 text-gray-500 text-sm">
                                            카테고리를 선택해주세요
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

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
        </div>
    );
};

export default MainPage;
