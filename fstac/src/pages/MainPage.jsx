import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import apiClient from '@/api/axios';
import { getMyCategories, getCategoryDisplayName } from '@/api/categoryApi';
import { getNewsByUserCategories, getNewsByCategory } from '@/api/userCategoryNewsApi';

const MainPage = () => {
  // 캐러셀 상태
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  // 새로운 소식 탭 상태
  const [newsTab, setNewsTab] = useState('전체');

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

  // 캐러셀 데이터
  const carouselData = [
    {
      title: '물음표에서 시작된 빛 \n 스스로 만든 느낌표가 되다',
      id: 1
    },
    {
      title: '두 번째 슬라이드 제목',
      id: 2
    },
    {
      title: '세 번째 슬라이드 제목',
      id: 3
    }
  ];

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

    // 5초마다 데이터 갱신
    const interval = setInterval(fetchMarketData, 5000);

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

  return (
    <div className="min-h-screen bg-white">

      {/* 메인 배너/캐러셀 */}
      <section className="bg-gray-800 text-white py-12 px-4 md:px-8 h-[1100px] relative flex items-start">
        <div className="max-w-7xl mx-auto w-full pt-20 mt-[300px]">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-300">그룹소개</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="relative">
            <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight whitespace-pre-line">
              {carouselData[currentSlide].title}
            </h1>

            {/* 캐러셀 네비게이션 */}
            <div className="flex items-center gap-4 mt-[60px]">
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
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextSlide}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                aria-label="다음 슬라이드"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

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
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>시장 데이터를 불러오는 중...</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="font-semibold text-gray-900">조선경제 &gt;</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900">{economicData.chosun.value}</span>
                {economicData.chosun.change && (
                  <span className={parseFloat(economicData.chosun.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.chosun.change}
                  </span>
                )}
              </div>
              {/* 환율 데이터 */}
              <div className="flex items-center gap-2">
                <span className="text-gray-700">달러(USD)</span>
                <span className="text-gray-900">{economicData.dollar.value}</span>
                {economicData.dollar.change && (
                  <span className={parseFloat(economicData.dollar.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.dollar.change}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">위안(CNY)</span>
                <span className="text-gray-900">{economicData.yuan.value}</span>
                {economicData.yuan.change && (
                  <span className={parseFloat(economicData.yuan.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.yuan.change}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">유로(EUR)</span>
                <span className="text-gray-900">{economicData.euro.value}</span>
                {economicData.euro.change && (
                  <span className={parseFloat(economicData.euro.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.euro.change}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">파운드(GBP)</span>
                <span className="text-gray-900">{economicData.pound.value}</span>
                {economicData.pound.change && (
                  <span className={parseFloat(economicData.pound.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.pound.change}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">엔(JPY)</span>
                <span className="text-gray-900">{economicData.yen.value}</span>
                {economicData.yen.change && (
                  <span className={parseFloat(economicData.yen.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.yen.change}
                  </span>
                )}
              </div>
              {/* 한국 지수 */}
              <div className="flex items-center gap-2">
                <span className="text-gray-700">코스피</span>
                <span className="text-gray-900">{economicData.kospi.value}</span>
                {economicData.kospi.change && (
                  <span className={parseFloat(economicData.kospi.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.kospi.change}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">코스닥</span>
                <span className="text-gray-900">{economicData.kosdaq.value}</span>
                {economicData.kosdaq.change && (
                  <span className={parseFloat(economicData.kosdaq.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.kosdaq.change}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-700">코스피200</span>
                <span className="text-gray-900">{economicData.kospi200.value}</span>
                {economicData.kospi200.change && (
                  <span className={parseFloat(economicData.kospi200.change.replace(/[+,]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {economicData.kospi200.change}
                  </span>
                )}
              </div>
              {marketData.updatedAt && (
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(marketData.updatedAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 보도자료 및 사이드바 섹션 */}
      <section className="bg-gray-100 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 보도자료 섹션 (왼쪽 2/3) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">보도자료</h2>
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
