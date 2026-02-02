import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '@/api/axios';
import { getMyCategories, getCategoryDisplayName } from '@/api/categoryApi';
import { getNewsByUserCategories, getNewsByCategory } from '@/api/userCategoryNewsApi';

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
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const newsContainerRef = useRef(null);
  const videoAreaRef = useRef(null);
  const sidebarRef = useRef(null);
  const [sidebarHeight, setSidebarHeight] = useState('auto');
  const pageSize = 20; // 한 번에 가져올 뉴스 개수

  // 비디오 캐러셀 관련 상태
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoCarouselRef = useRef(null);
  const autoPlayIntervalRef = useRef(null);
  const [videoLoadErrors, setVideoLoadErrors] = useState({});
  const [videoLoaded, setVideoLoaded] = useState({});

  // 카테고리별 비디오 데이터 (더미)
  const videoCategories = ['politics', 'economy', 'culture', 'it', 'society', 'world'];
  const videoData = {
    politics: {
      title: '정치 뉴스',
      content: '최신 정치 동향과 정책 변화를 확인하세요',
      color: '#1e40af', // 파란색
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' // 더미 비디오 URL
    },
    economy: {
      title: '경제 뉴스',
      content: '시장 동향과 경제 지표를 실시간으로 확인하세요',
      color: '#059669', // 초록색
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    culture: {
      title: '문화 뉴스',
      content: '다양한 문화 소식과 이벤트를 만나보세요',
      color: '#7c3aed', // 보라색
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    it: {
      title: 'IT/과학 뉴스',
      content: '최신 기술 트렌드와 과학 뉴스를 확인하세요',
      color: '#dc2626', // 빨간색
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    },
    society: {
      title: '사회 뉴스',
      content: '사회 이슈와 사람들의 이야기를 전합니다',
      color: '#ea580c', // 주황색
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
    },
    world: {
      title: '국제 뉴스',
      content: '전 세계 주요 뉴스와 국제 정세를 파악하세요',
      color: '#0891b2', // 청록색
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
    }
  };

  // 특정 카테고리의 뉴스만 가져오는 함수 (초기 로드)
  const fetchNewsByCategory = useCallback(async (category, reset = true, currentCount = 0) => {
    if (!category) return;

    try {
      if (reset) {
        setIsLoadingNews(true);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      // 현재 뉴스 개수를 기반으로 limit 계산
      const limit = currentCount + pageSize;

      console.log(`[DEBUG] 카테고리 조회 시작: category="${category}", limit=${limit}`);
      const newsData = await getNewsByCategory(category, limit);
      console.log(`[DEBUG] 서버 응답 데이터:`, newsData);

      if (newsData) {
        if (reset) {
          setBriefingNews(newsData || []);
        } else {
          // 중복 제거를 위해 기존 데이터와 병합
          setBriefingNews(prevNews => {
            const existingIds = new Set(prevNews.map(n => n.id));
            const newNews = (newsData || []).filter(n => !existingIds.has(n.id));

            if (newNews.length === 0) {
              setHasMore(false);
              return prevNews;
            } else {
              return [...prevNews, ...newNews];
            }
          });
        }

        // 가져온 데이터가 limit보다 적으면 더 이상 데이터가 없음
        if (newsData.length < limit) {
          setHasMore(false);
        }

        console.log(`카테고리 "${category}" (${getCategoryDisplayName(category)}) 뉴스 조회 완료:`, newsData.length, '개');
        if (newsData.length === 0 && reset) {
          console.warn(`[경고] 카테고리 "${category}"에 대한 뉴스가 없습니다.`);
        }
      }
    } catch (error) {
      console.error(`카테고리 "${category}" 뉴스 조회 실패:`, error);
      setHasMore(false);
    } finally {
      setIsLoadingNews(false);
      setIsLoadingMore(false);
    }
  }, []);

  // 추가 뉴스 로드 함수
  const loadMoreNews = useCallback(() => {
    if (!selectedCategory || isLoadingMore || !hasMore) return;
    fetchNewsByCategory(selectedCategory, false, briefingNews.length);
  }, [selectedCategory, isLoadingMore, hasMore, fetchNewsByCategory, briefingNews.length]);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    const container = newsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 스크롤이 하단 100px 이내에 도달하면 다음 데이터 로드
      if (scrollHeight - scrollTop - clientHeight < 100) {
        loadMoreNews();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMoreNews]);

  // 비디오 영역 높이에 맞춰 관심 보도자료 영역 높이 조정
  useEffect(() => {
    const updateSidebarHeight = () => {
      if (videoAreaRef.current && sidebarRef.current) {
        const videoHeight = videoAreaRef.current.offsetHeight;
        setSidebarHeight(`${videoHeight}px`);
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

  // 비디오 자동 재생 및 자동 스크롤
  useEffect(() => {
    // 10초마다 다음 비디오로 자동 전환
    autoPlayIntervalRef.current = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % videoCategories.length;
        return nextIndex;
      });
    }, 10000); // 10초

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
      }
    };
  }, [videoCategories.length]);

  // 활성화된 비디오 재생
  useEffect(() => {
    const videoElements = document.querySelectorAll('.video-carousel-item');
    videoElements.forEach((video, index) => {
      if (index === currentVideoIndex) {
        const videoEl = video.querySelector('video');
        if (videoEl) {
          videoEl.play().catch(err => {
            console.log('비디오 자동 재생 실패:', err);
          });
        }
      } else {
        const videoEl = video.querySelector('video');
        if (videoEl) {
          videoEl.pause();
        }
      }
    });
  }, [currentVideoIndex]);

  // 비디오 인덱스 변경 시 스크롤 애니메이션
  useEffect(() => {
    if (videoCarouselRef.current) {
      const scrollPosition = currentVideoIndex * videoCarouselRef.current.offsetWidth;
      videoCarouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentVideoIndex]);

  // 비디오 네비게이션 함수
  const goToVideo = (index) => {
    setCurrentVideoIndex(index);
    // 자동 재생 타이머 리셋
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
    }
    autoPlayIntervalRef.current = setInterval(() => {
      setCurrentVideoIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % videoCategories.length;
        return nextIndex;
      });
    }, 10000); // 10초
  };

  const goToPreviousVideo = () => {
    const prevIndex = (currentVideoIndex - 1 + videoCategories.length) % videoCategories.length;
    goToVideo(prevIndex);
  };

  const goToNextVideo = () => {
    const nextIndex = (currentVideoIndex + 1) % videoCategories.length;
    goToVideo(nextIndex);
  };

  // 시장 데이터 상태
  const [marketData, setMarketData] = useState({
    exchangeRates: {},
    koreanIndices: {},
    globalIndices: {},
    updatedAt: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // 시장 데이터 가져오기
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await apiClient.get('/api/market/latest');
        if (response.data) {
          setMarketData(response.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('시장 데이터 조회 실패:', error);
        setIsLoading(false);
      }
    };

    // 초기 데이터 로드
    fetchMarketData();

    // 15초마다 데이터 갱신 (서버 수집 주기 15초에 맞춤)
    const interval = setInterval(fetchMarketData, 15000);

    return () => clearInterval(interval);
  }, []);

  // 사용자 관심 카테고리 및 뉴스 데이터 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoadingNews(true);

        // 사용자 관심 카테고리 조회
        const categories = await getMyCategories();
        setUserCategories(categories || []);

        // 사용자 관심 카테고리별 뉴스 조회
        const newsData = await getNewsByUserCategories(50); // 충분한 개수 조회
        if (newsData) {
          setBriefingNews(newsData || []);

          // 디버깅: 받아온 데이터 확인
          console.log('받아온 뉴스 데이터:', newsData);
          console.log('뉴스 카테고리 목록:', newsData.map(n => n.category));

          // 첫 번째 카테고리를 기본 선택
          if (categories && categories.length > 0) {
            setSelectedCategory(categories[0]);
            console.log('선택된 카테고리:', categories[0]);
            console.log('사용자 관심 카테고리:', categories);
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

  // 데이터 포맷팅 함수
  const formatNumber = (num) => {
    if (num == null) return '0';
    return typeof num === 'number' ? num.toLocaleString('ko-KR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) : num;
  };

  const formatChange = (change) => {
    if (change == null || change === 0) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${formatNumber(change)}`;
  };

  const formatChangePercent = (changePercent) => {
    if (changePercent == null || changePercent === 0) return '';
    const sign = changePercent > 0 ? '+' : '';
    return `${sign}${formatNumber(changePercent)}%`;
  };

  // 환율 데이터 추출
  const getExchangeRate = (code) => {
    const rate = marketData.exchangeRates?.[code];
    if (!rate) return { value: '0', change: '' };
    return {
      value: formatNumber(rate.rate),
      change: formatChange(rate.change)
    };
  };

  // 지수 데이터 추출
  const getIndex = (indices, symbol) => {
    const index = indices?.[symbol];
    if (!index) return { value: '0', change: '', changeValue: 0 };
    return {
      value: formatNumber(index.value),
      change: formatChange(index.change),
      changeValue: index.change || 0
    };
  };

  // 경제 데이터 추출
  const economicData = {
    // 조선경제 (글로벌 지수에서 가져오거나 기본값)
    chosun: getIndex(marketData.globalIndices, 'SPX'),
    // 환율 데이터
    dollar: getExchangeRate('USD'),      // 달러
    yuan: getExchangeRate('CNY'),        // 위안
    euro: getExchangeRate('EUR'),        // 유로
    pound: getExchangeRate('GBP'),       // 파운드
    yen: getExchangeRate('JPY'),         // 원(엔)
    // 한국 지수
    kospi: getIndex(marketData.koreanIndices, 'KS11'),
    kosdaq: getIndex(marketData.koreanIndices, 'KQ11'),
    kospi200: marketData.koreanIndices?.KS11 ? {
      value: formatNumber((marketData.koreanIndices.KS11.value * 0.3).toFixed(2)),
      change: formatChange(marketData.koreanIndices.KS11.change * 0.3),
      changeValue: (marketData.koreanIndices.KS11.change || 0) * 0.3
    } : { value: '0', change: '', changeValue: 0 }
  };

  // 경제 지표 색상 결정 함수 (문자열용)
  const getEconomyColor = (changeStr) => {
    if (!changeStr) return 'text-gray-900';
    const value = parseFloat(changeStr.replace(/[+,]/g, ''));
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-900';
  };

  // 경제 지표 색상 결정 함수 (숫자용)
  const getEconomyColorByValue = (changeValue) => {
    if (changeValue == null || changeValue === 0) return '';
    if (changeValue > 0) return 'text-green-600';
    if (changeValue < 0) return 'text-red-600';
    return '';
  };



  return (
    <div className="min-h-screen bg-white">

      {/* 경제 데이터 */}
      <section className="bg-white border-y border-gray-200 py-3 sm:py-4 px-2 sm:px-4 md:px-8 overflow-hidden mt-16 sm:mt-20">
        <div className="max-w-7xl mx-auto relative">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
              <span>시장 데이터를 불러오는 중...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 bg-white z-10 pr-2 sm:pr-4 whitespace-nowrap text-xs sm:text-sm">경제 &gt;</span>
              <div className="flex-1 overflow-hidden relative h-5 sm:h-6">
                <div className="flex items-center gap-4 sm:gap-6 md:gap-8 animate-marquee whitespace-nowrap absolute">
                  {/* 첫 번째 세트 */}
                  <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">S&P 500</span>
                      <span className={`${getEconomyColor(economicData.chosun.change)} font-medium text-[10px] sm:text-xs`}>{economicData.chosun.value}</span>
                      {economicData.chosun.change && (
                        <span className={`text-[9px] sm:text-xs ${getEconomyColor(economicData.chosun.change)}`}>
                          {economicData.chosun.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">달러(USD)</span>
                      <span className={`${getEconomyColor(economicData.dollar.change)} font-medium text-[10px] sm:text-xs`}>{economicData.dollar.value}</span>
                      {economicData.dollar.change && (
                        <span className={`text-[9px] sm:text-xs ${getEconomyColor(economicData.dollar.change)}`}>
                          {economicData.dollar.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">위안(CNY)</span>
                      <span className={`${getEconomyColor(economicData.yuan.change)} font-medium`}>{economicData.yuan.value}</span>
                      {economicData.yuan.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.yuan.change)}`}>
                          {economicData.yuan.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">유로(EUR)</span>
                      <span className={`${getEconomyColor(economicData.euro.change)} font-medium`}>{economicData.euro.value}</span>
                      {economicData.euro.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.euro.change)}`}>
                          {economicData.euro.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">파운드(GBP)</span>
                      <span className={`${getEconomyColor(economicData.pound.change)} font-medium`}>{economicData.pound.value}</span>
                      {economicData.pound.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.pound.change)}`}>
                          {economicData.pound.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">엔(JPY)</span>
                      <span className={`${getEconomyColor(economicData.yen.change)} font-medium`}>{economicData.yen.value}</span>
                      {economicData.yen.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.yen.change)}`}>
                          {economicData.yen.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">코스피</span>
                      <span className={`${getEconomyColorByValue(economicData.kospi.changeValue)} font-medium`}>{economicData.kospi.value}</span>
                      {economicData.kospi.change && (
                        <span className={`text-xs ${getEconomyColorByValue(economicData.kospi.changeValue)}`}>
                          {economicData.kospi.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">코스닥</span>
                      <span className={`${getEconomyColorByValue(economicData.kosdaq.changeValue)} font-medium`}>{economicData.kosdaq.value}</span>
                      {economicData.kosdaq.change && (
                        <span className={`text-xs ${getEconomyColorByValue(economicData.kosdaq.changeValue)}`}>
                          {economicData.kosdaq.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">코스피200</span>
                      <span className={`${getEconomyColor(economicData.kospi200.change)} font-medium`}>{economicData.kospi200.value}</span>
                      {economicData.kospi200.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.kospi200.change)}`}>
                          {economicData.kospi200.change}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 무한 루프를 위한 두 번째 동일 세트 */}
                  <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">S&P 500</span>
                      <span className={`${getEconomyColor(economicData.chosun.change)} font-medium text-[10px] sm:text-xs`}>{economicData.chosun.value}</span>
                      {economicData.chosun.change && (
                        <span className={`text-[9px] sm:text-xs ${getEconomyColor(economicData.chosun.change)}`}>
                          {economicData.chosun.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">달러(USD)</span>
                      <span className={`${getEconomyColor(economicData.dollar.change)} font-medium text-[10px] sm:text-xs`}>{economicData.dollar.value}</span>
                      {economicData.dollar.change && (
                        <span className={`text-[9px] sm:text-xs ${getEconomyColor(economicData.dollar.change)}`}>
                          {economicData.dollar.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">위안(CNY)</span>
                      <span className={`${getEconomyColor(economicData.yuan.change)} font-medium`}>{economicData.yuan.value}</span>
                      {economicData.yuan.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.yuan.change)}`}>
                          {economicData.yuan.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">유로(EUR)</span>
                      <span className={`${getEconomyColor(economicData.euro.change)} font-medium`}>{economicData.euro.value}</span>
                      {economicData.euro.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.euro.change)}`}>
                          {economicData.euro.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">파운드(GBP)</span>
                      <span className={`${getEconomyColor(economicData.pound.change)} font-medium`}>{economicData.pound.value}</span>
                      {economicData.pound.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.pound.change)}`}>
                          {economicData.pound.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">엔(JPY)</span>
                      <span className={`${getEconomyColor(economicData.yen.change)} font-medium`}>{economicData.yen.value}</span>
                      {economicData.yen.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.yen.change)}`}>
                          {economicData.yen.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">코스피</span>
                      <span className={`${getEconomyColorByValue(economicData.kospi.changeValue)} font-medium`}>{economicData.kospi.value}</span>
                      {economicData.kospi.change && (
                        <span className={`text-xs ${getEconomyColorByValue(economicData.kospi.changeValue)}`}>
                          {economicData.kospi.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">코스닥</span>
                      <span className={`${getEconomyColorByValue(economicData.kosdaq.changeValue)} font-medium`}>{economicData.kosdaq.value}</span>
                      {economicData.kosdaq.change && (
                        <span className={`text-xs ${getEconomyColorByValue(economicData.kosdaq.changeValue)}`}>
                          {economicData.kosdaq.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">코스피200</span>
                      <span className={`${getEconomyColor(economicData.kospi200.change)} font-medium`}>{economicData.kospi200.value}</span>
                      {economicData.kospi200.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.kospi200.change)}`}>
                          {economicData.kospi200.change}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {marketData.updatedAt && (
                <span className="text-[10px] text-gray-400 bg-white z-10 pl-4 whitespace-nowrap">
                  {new Date(marketData.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* 그룹소개 & 관심 보도자료 섹션 */}
      <section className="bg-white py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-8">
        <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:items-start">
          {/* 왼쪽: 비디오 영역 */}
          <div ref={videoAreaRef} className="relative w-full">
            {/* 카테고리 필터 버튼 */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {videoCategories.map((category, index) => (
                <button
                  key={category}
                  onClick={() => goToVideo(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    currentVideoIndex === index
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))}
            </div>

            {/* 비디오 캐러셀 */}
            <div className="relative overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
              <div 
                ref={videoCarouselRef}
                className="flex overflow-x-hidden scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
              >
                {videoCategories.map((category, index) => {
                  const video = videoData[category];
                  const isActive = currentVideoIndex === index;
                  const hasError = videoLoadErrors[category];
                  const isLoaded = videoLoaded[category];
                  
                  return (
                    <div
                      key={category}
                      className="video-carousel-item relative w-full flex-shrink-0 aspect-video sm:aspect-[21/9]"
                      style={{ backgroundColor: video.color }}
                    >
                      {/* 비디오 플레이어 - 항상 렌더링하되 활성화된 경우만 표시 */}
                      <video
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="auto"
                        style={{ 
                          display: isActive ? 'block' : 'none',
                          zIndex: 1,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%'
                        }}
                        onLoadedData={() => {
                          setVideoLoaded(prev => ({ ...prev, [category]: true }));
                        }}
                        onCanPlay={() => {
                          setVideoLoaded(prev => ({ ...prev, [category]: true }));
                        }}
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
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ 
                            backgroundColor: video.color,
                            zIndex: 2
                          }}
                        >
                          <div className="text-center text-white">
                            <p className="text-lg sm:text-xl font-medium mb-2">
                              {getCategoryDisplayName(category)} 영상 미리보기
                            </p>
                            <p className="text-sm opacity-80">10초</p>
                          </div>
                        </div>
                      )}
                      
                      {/* 로딩 중 표시 */}
                      {isActive && !isLoaded && !hasError && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30"
                          style={{ zIndex: 3 }}
                        >
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-sm">영상 로딩 중...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 좌우 화살표 버튼 */}
              <button
                onClick={goToPreviousVideo}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                aria-label="이전 비디오"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNextVideo}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                aria-label="다음 비디오"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 비디오 정보 (Title & Contents) */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {videoData[videoCategories[currentVideoIndex]]?.title || 'Title'}
              </h3>
              <p className="text-sm text-gray-600">
                {videoData[videoCategories[currentVideoIndex]]?.content || 'Contents'}
              </p>
            </div>
          </div>

          {/* 오른쪽: 관심 보도자료 사이드바 */}
          <div ref={sidebarRef} className="bg-white rounded-lg flex flex-col min-h-0" style={{ height: sidebarHeight }}>
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
                        {isLoadingMore && (
                          <div className="flex items-center justify-center py-4">
                            <span className="text-gray-500 text-xs sm:text-sm">더 많은 뉴스를 불러오는 중...</span>
                          </div>
                        )}
                        {!hasMore && briefingNews.length > 0 && (
                          <div className="flex items-center justify-center py-4">
                            <span className="text-gray-400 text-xs sm:text-sm">모든 뉴스를 불러왔습니다</span>
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
    </div>
  );
};

export default MainPage;
