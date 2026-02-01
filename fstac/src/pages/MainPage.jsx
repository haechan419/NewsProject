import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/api/axios';
import { getMyCategories, getCategoryDisplayName } from '@/api/categoryApi';
import { getNewsByUserCategories, getNewsByCategory } from '@/api/userCategoryNewsApi';

const MainPage = () => {
  // 뉴스 요약 영상 더미 데이터 (6개 카테고리)
  const videoData = [
    {
      id: 1,
      category: '정치',
      title: '정치 주요 이슈 요약',
      thumbnail: 'https://via.placeholder.com/800x450/1e40af/ffffff?text=%EC%A0%95%EC%B9%98+%EB%89%B4%EC%8A%A4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      description: '이번 주 정치 분야 주요 뉴스를 요약한 영상입니다.'
    },
    {
      id: 2,
      category: '경제',
      title: '경제 동향 분석',
      thumbnail: 'https://via.placeholder.com/800x450/059669/ffffff?text=%EA%B2%BD%EC%A0%9C+%EB%89%B4%EC%8A%A4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      description: '최신 경제 동향과 시장 분석을 담은 영상입니다.'
    },
    {
      id: 3,
      category: '엔터테인먼트',
      title: '엔터 이슈 모음',
      thumbnail: 'https://via.placeholder.com/800x450/dc2626/ffffff?text=%EC%97%94%ED%84%B0%ED%85%8C%EC%9D%B8%EB%A8%BC%ED%8A%B8',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      description: '연예계 주요 이슈와 소식을 정리한 영상입니다.'
    },
    {
      id: 4,
      category: 'IT/과학',
      title: 'IT/과학 최신 소식',
      thumbnail: 'https://via.placeholder.com/800x450/7c3aed/ffffff?text=IT%2F%EA%B3%BC%ED%95%99',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      description: '최신 기술 동향과 과학 뉴스를 다룬 영상입니다.'
    },
    {
      id: 5,
      category: '스포츠',
      title: '스포츠 하이라이트',
      thumbnail: 'https://via.placeholder.com/800x450/ea580c/ffffff?text=%EC%8A%A4%ED%8F%AC%EC%B8%A0',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      description: '주요 스포츠 경기 결과와 이슈를 모은 영상입니다.'
    },
    {
      id: 6,
      category: '국제',
      title: '국제 뉴스 브리핑',
      thumbnail: 'https://via.placeholder.com/800x450/0891b2/ffffff?text=%EA%B5%AD%EC%A0%9C+%EB%89%B4%EC%8A%A4',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      description: '글로벌 주요 뉴스를 정리한 영상입니다.'
    }
  ];

  // 영상 슬라이드 상태
  const [currentVideoSlide, setCurrentVideoSlide] = useState(0);
  const totalVideoSlides = 6;

  // 영상 재생 상태 관리 (각 영상 ID별로 재생 여부)
  const [playingVideos, setPlayingVideos] = useState({});

  // 영상 재생 토글 함수
  const handleVideoPlay = (videoId) => {
    setPlayingVideos((prev) => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  // 영상 자동 슬라이드 (10초마다, 단 영상 재생 중이면 건너뜀)
  useEffect(() => {
    const videoTimer = setInterval(() => {
      setCurrentVideoSlide((prev) => {
        // 현재 슬라이드의 영상이 재생 중인지 확인
        const currentVideoId = videoData[prev].id;
        const isCurrentVideoPlaying = playingVideos[currentVideoId];

        // 영상이 재생 중이면 자동 슬라이드 건너뛰기
        if (isCurrentVideoPlaying) {
          return prev;
        }

        // 영상이 재생 중이 아니면 다음 슬라이드로 이동
        const nextSlide = prev === totalVideoSlides - 1 ? 0 : prev + 1;
        return nextSlide;
      });
    }, 10000);
    return () => clearInterval(videoTimer);
  }, [playingVideos]);

  // 새로운 소식 탭 상태
  const [newsTab, setNewsTab] = useState('전체');
  const [newsList, setNewsList] = useState([]);
  const [isLoadingNewsSection, setIsLoadingNewsSection] = useState(false);

  // 보도자료 탭 상태 (사용자 관심 카테고리)
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 사용자 관심 카테고리 목록
  const [userCategories, setUserCategories] = useState([]);

  // 사용자 관심 카테고리별 뉴스 데이터 (BriefingResponseDTO)
  const [briefingNews, setBriefingNews] = useState([]);

  // 로딩 상태
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  // 특정 카테고리의 뉴스만 가져오는 함수
  const fetchNewsByCategory = async (category) => {
    if (!category) return;

    try {
      setIsLoadingNews(true);
      console.log(`[DEBUG] 카테고리 조회 시작: category="${category}"`);
      const newsData = await getNewsByCategory(category, 50);
      console.log(`[DEBUG] 서버 응답 데이터:`, newsData);
      if (newsData) {
        setBriefingNews(newsData || []);
        console.log(`카테고리 "${category}" (${getCategoryDisplayName(category)}) 뉴스 조회 완료:`, newsData.length, '개');
        if (newsData.length === 0) {
          console.warn(`[경고] 카테고리 "${category}"에 대한 뉴스가 없습니다.`);
        }
      }
    } catch (error) {
      console.error(`카테고리 "${category}" 뉴스 조회 실패:`, error);
    } finally {
      setIsLoadingNews(false);
    }
  };

  // 새로운 소식 페이지네이션
  const [newsPage, setNewsPage] = useState(1);
  const totalNewsPages = 2;

  // 새로운 소식 데이터 가져오기 (카테고리별)
  useEffect(() => {
    const fetchNewsForSection = async () => {
      try {
        setIsLoadingNewsSection(true);
        let data = [];
        if (newsTab === '전체') {
          // '전체'일 경우 사용자 관심 카테고리 전체 뉴스 가져오기
          data = await getNewsByUserCategories(6);
        } else {
          // 특정 구 카테고리 뉴스 가져오기
          data = await getNewsByCategory(newsTab, 6);
        }
        setNewsList(data || []);
      } catch (error) {
        console.error('새로운 소식 조회 실패:', error);
      } finally {
        setIsLoadingNewsSection(false);
      }
    };

    fetchNewsForSection();
  }, [newsTab]);

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
    }
  ];


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
    if (!index) return { value: '0', change: '' };
    return {
      value: formatNumber(index.value),
      change: formatChange(index.change)
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
      change: formatChange(marketData.koreanIndices.KS11.change * 0.3)
    } : { value: '0', change: '' }
  };

  // 경제 지표 색상 결정 함수
  const getEconomyColor = (changeStr) => {
    if (!changeStr) return 'text-gray-900';
    const value = parseFloat(changeStr.replace(/[+,]/g, ''));
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-900';
  };

  const handlePrevVideoSlide = () => {
    setCurrentVideoSlide((prev) => {
      const currentVideoId = videoData[prev].id;
      // 현재 영상 재생 중지
      setPlayingVideos((prevVideos) => ({
        ...prevVideos,
        [currentVideoId]: false
      }));
      return prev === 0 ? totalVideoSlides - 1 : prev - 1;
    });
  };

  const handleNextVideoSlide = () => {
    setCurrentVideoSlide((prev) => {
      const currentVideoId = videoData[prev].id;
      // 현재 영상 재생 중지
      setPlayingVideos((prevVideos) => ({
        ...prevVideos,
        [currentVideoId]: false
      }));
      return prev === totalVideoSlides - 1 ? 0 : prev + 1;
    });
  };

  const handlePrevNewsPage = () => {
    setNewsPage((prev) => (prev === 1 ? totalNewsPages : prev - 1));
  };

  const handleNextNewsPage = () => {
    setNewsPage((prev) => (prev === totalNewsPages ? 1 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-white">

      {/* 메인 배너/영상 섹션 */}
      <section className="bg-gray-800 text-white py-6 px-4 md:px-8 min-h-[600px] relative flex items-start">
        <div className="max-w-7xl mx-auto w-full pt-8 mt-[50px]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-300">그룹소개</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="relative">
            {/* 뉴스 요약 영상 섹션 - 가로 슬라이드 */}
            <div>
              <div className="relative overflow-hidden">
                {/* 영상 카드 컨테이너 */}
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentVideoSlide * 100}%)` }}
                >
                  {videoData.map((video) => (
                    <div
                      key={video.id}
                      className="min-w-full shrink-0"
                    >
                      <div className="relative bg-gray-700 rounded-lg overflow-hidden">
                        {/* 영상 플레이어 또는 썸네일 */}
                        <div className="relative aspect-video bg-black">
                          {playingVideos[video.id] ? (
                            <video
                              src={video.videoUrl}
                              className="w-full h-full object-contain"
                              controls
                              autoPlay
                              preload="metadata"
                            >
                              브라우저가 비디오 태그를 지원하지 않습니다.
                            </video>
                          ) : (
                            <div
                              className="relative w-full h-full cursor-pointer group"
                              onClick={() => handleVideoPlay(video.id)}
                            >
                              <img
                                src={video.thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-opacity-100 transition-all">
                                    <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                  <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold mb-2">
                                    {video.category}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* 카테고리 배지 (비디오 재생 중일 때만) */}
                          {playingVideos[video.id] && (
                            <div className="absolute top-4 left-4 z-10">
                              <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                {video.category}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 영상 정보 */}
                        <div className="p-6">
                          <h3 className="text-xl font-bold mb-2">{video.title}</h3>
                          <p className="text-gray-300 text-sm">{video.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 좌우 네비게이션 버튼 */}
                <button
                  onClick={handlePrevVideoSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all z-10"
                  aria-label="이전 영상"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextVideoSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all z-10"
                  aria-label="다음 영상"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* 영상 인디케이터 */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {String(currentVideoSlide + 1).padStart(2, '0')}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-lg text-gray-400">
                    {String(totalVideoSlides).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* 카테고리 인디케이터 */}
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                {videoData.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      // 현재 영상 재생 중지
                      const currentVideoId = videoData[currentVideoSlide].id;
                      setPlayingVideos((prevVideos) => ({
                        ...prevVideos,
                        [currentVideoId]: false
                      }));
                      setCurrentVideoSlide(index);
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${currentVideoSlide === index
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                  >
                    {video.category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 새로운 소식 섹션 */}
      <section className="bg-gray-100 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">새로운 소식</h2>
          </div>

          {/* 탭 */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <button
              onClick={() => setNewsTab('전체')}
              className={`px-4 py-2 rounded transition-colors ${newsTab === '전체'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
            >
              전체
            </button>
            {userCategories.length > 0 ? (
              userCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setNewsTab(category)}
                  className={`px-4 py-2 rounded transition-colors ${newsTab === category
                    ? 'bg-gray-800 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {getCategoryDisplayName(category)}
                </button>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">관심 카테고리를 설정하면 맞춤 뉴스를 볼 수 있습니다.</span>
            )}
          </div>

          {/* 뉴스 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {isLoadingNewsSection ? (
              <div className="col-span-3 text-center py-12 text-gray-500">
                뉴스를 불러오는 중...
              </div>
            ) : newsList.length > 0 ? (
              newsList.slice(0, 3).map((news) => (
                <Card
                  key={news.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    if (news.originalUrl) {
                      window.open(news.originalUrl, '_blank');
                    }
                  }}
                >
                  <div className="relative">
                    <img
                      src={news.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'}
                      alt={news.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {getCategoryDisplayName(news.category)}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{news.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{news.summary}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {news.date ? new Date(news.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-gray-500">
                해당 카테고리의 뉴스가 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 경제 데이터 */}
      <section className="bg-white border-y border-gray-200 py-4 px-4 md:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>시장 데이터를 불러오는 중...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 bg-white z-10 pr-4 whitespace-nowrap">경제 &gt;</span>
              <div className="flex-1 overflow-hidden relative h-6">
                <div className="flex items-center gap-8 animate-marquee whitespace-nowrap absolute">
                  {/* 첫 번째 세트 */}
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">S&P 500</span>
                      <span className={`${getEconomyColor(economicData.chosun.change)} font-medium`}>{economicData.chosun.value}</span>
                      {economicData.chosun.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.chosun.change)}`}>
                          {economicData.chosun.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">달러(USD)</span>
                      <span className={`${getEconomyColor(economicData.dollar.change)} font-medium`}>{economicData.dollar.value}</span>
                      {economicData.dollar.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.dollar.change)}`}>
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
                      <span className={`${getEconomyColor(economicData.kospi.change)} font-medium`}>{economicData.kospi.value}</span>
                      {economicData.kospi.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.kospi.change)}`}>
                          {economicData.kospi.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">코스닥</span>
                      <span className={`${getEconomyColor(economicData.kosdaq.change)} font-medium`}>{economicData.kosdaq.value}</span>
                      {economicData.kosdaq.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.kosdaq.change)}`}>
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
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">S&P 500</span>
                      <span className={`${getEconomyColor(economicData.chosun.change)} font-medium`}>{economicData.chosun.value}</span>
                      {economicData.chosun.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.chosun.change)}`}>
                          {economicData.chosun.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">달러(USD)</span>
                      <span className={`${getEconomyColor(economicData.dollar.change)} font-medium`}>{economicData.dollar.value}</span>
                      {economicData.dollar.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.dollar.change)}`}>
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
                      <span className={`${getEconomyColor(economicData.kospi.change)} font-medium`}>{economicData.kospi.value}</span>
                      {economicData.kospi.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.kospi.change)}`}>
                          {economicData.kospi.change}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-700">코스닥</span>
                      <span className={`${getEconomyColor(economicData.kosdaq.change)} font-medium`}>{economicData.kosdaq.value}</span>
                      {economicData.kosdaq.change && (
                        <span className={`text-xs ${getEconomyColor(economicData.kosdaq.change)}`}>
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

      {/* 보도자료 및 사이드바 섹션 */}
      <section className="bg-gray-100 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 보도자료 섹션 (왼쪽 2/3) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">관심 보도자료</h2>
              <div className="flex gap-2 flex-wrap">
                {userCategories.length > 0 ? (
                  userCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        // 카테고리 클릭 시 해당 카테고리 뉴스만 서버에서 가져오기
                        fetchNewsByCategory(category);
                      }}
                      className={`px-4 py-2 rounded transition-colors ${selectedCategory === category
                        ? 'bg-gray-800 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {getCategoryDisplayName(category)}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">관심 카테고리를 선택해주세요</span>
                )}
              </div>
            </div>

            {/* 뉴스 리스트 (3x3 그리드) */}
            {isLoadingNews ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-gray-500">뉴스를 불러오는 중...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedCategory ? (
                  briefingNews.length > 0 ? (
                    briefingNews.slice(0, 9).map((news) => (
                      <div
                        key={news.id}
                        className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          if (news.originalUrl) {
                            window.open(news.originalUrl, '_blank');
                          }
                        }}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm mb-2 line-clamp-2">{news.title}</h3>
                            {news.summary && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-3">{news.summary}</p>
                            )}
                            {news.date && (
                              <p className="text-xs text-gray-500 mt-2">
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
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-12 text-gray-500">
                      해당 카테고리의 뉴스가 없습니다
                    </div>
                  )
                ) : (
                  <div className="col-span-3 text-center py-12 text-gray-500">
                    카테고리를 선택해주세요
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
};

export default MainPage;
