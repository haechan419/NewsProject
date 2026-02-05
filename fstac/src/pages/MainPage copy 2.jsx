import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import apiClient from "@/api/axios";
import { getMyCategories, getCategoryDisplayName } from "@/api/categoryApi";
import {
  getNewsByUserCategories,
  getNewsByCategory,
} from "@/api/userCategoryNewsApi";

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
  const [sidebarHeight, setSidebarHeight] = useState("auto");
  const pageSize = 10; // 한 번에 가져올 뉴스 개수 (카테고리별 최대 10개)

  // 비디오 그리드 관련 상태
  const [videoLoadErrors, setVideoLoadErrors] = useState({});
  const [videoLoaded, setVideoLoaded] = useState({});
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const fullscreenVideoRef = useRef(null);
  const [fullscreenVideoCategory, setFullscreenVideoCategory] = useState(null);

  // 카테고리별 비디오 데이터
  const videoCategories = [
    "politics",
    "economy",
    "culture",
    "it",
    "society",
    "world",
  ];
  const videoData = {
    politics: {
      title: "정치 뉴스",
      content: "최신 정치 동향과 정책 변화를 확인하세요",
      color: "#1e40af",
      videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    },
    economy: {
      title: "경제 뉴스",
      content: "시장 동향과 경제 지표를 실시간으로 확인하세요",
      color: "#059669",
      videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    },
    culture: {
      title: "문화 뉴스",
      content: "다양한 문화 소식과 이벤트를 만나보세요",
      color: "#7c3aed",
      videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    },
    it: {
      title: "IT/과학 뉴스",
      content: "최신 기술 트렌드와 과학 뉴스를 확인하세요",
      color: "#dc2626",
      videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    },
    society: {
      title: "사회 뉴스",
      content: "사회 이슈와 사람들의 이야기를 전합니다",
      color: "#ea580c",
      videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    },
    world: {
      title: "국제 뉴스",
      content: "전 세계 주요 뉴스와 국제 정세를 파악하세요",
      color: "#0891b2",
      videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    },
  };

  // 특정 카테고리의 뉴스만 가져오는 함수 (초기 로드) - 최대 10개만
  const fetchNewsByCategory = useCallback(
      async (category, reset = true, currentCount = 0) => {
        if (!category) return;

        try {
          if (reset) {
            setIsLoadingNews(true);
            setHasMore(false); // 10개 제한이므로 더 이상 로드하지 않음
          } else {
            setIsLoadingMore(true);
          }

          // 카테고리별 최대 10개만 가져오기
          const limit = 10;

          console.log(
              `[DEBUG] 카테고리 조회 시작: category="${category}", limit=${limit}`,
          );
          const newsData = await getNewsByCategory(category, limit);
          console.log(`[DEBUG] 서버 응답 데이터:`, newsData);

          if (newsData) {
            // 최대 10개만 표시
            const limitedNews = (newsData || []).slice(0, 10);

            if (reset) {
              setBriefingNews(limitedNews);
            } else {
              // 추가 로드는 비활성화 (10개 제한)
              setBriefingNews((prevNews) => prevNews);
            }

            // 항상 더 이상 데이터가 없음 (10개 제한)
            setHasMore(false);

            console.log(
                `카테고리 "${category}" (${getCategoryDisplayName(category)}) 뉴스 조회 완료:`,
                limitedNews.length,
                "개",
            );
            if (limitedNews.length === 0 && reset) {
              console.warn(
                  `[경고] 카테고리 "${category}"에 대한 뉴스가 없습니다.`,
              );
            }
          }
        } catch (error) {
          console.error(`카테고리 "${category}" 뉴스 조회 실패:`, error);
          setHasMore(false);
        } finally {
          setIsLoadingNews(false);
          setIsLoadingMore(false);
        }
      },
      [],
  );

  // 추가 뉴스 로드 함수
  const loadMoreNews = useCallback(() => {
    if (!selectedCategory || isLoadingMore || !hasMore) return;
    fetchNewsByCategory(selectedCategory, false, briefingNews.length);
  }, [
    selectedCategory,
    isLoadingMore,
    hasMore,
    fetchNewsByCategory,
    briefingNews.length,
  ]);

  // 스크롤 이벤트 핸들러 (10개 제한으로 인해 비활성화)
  useEffect(() => {
    // 카테고리별 10개 제한이므로 무한 스크롤 비활성화
    // const container = newsContainerRef.current;
    // if (!container) return;
    // const handleScroll = () => {
    //   const { scrollTop, scrollHeight, clientHeight } = container;
    //   // 스크롤이 하단 100px 이내에 도달하면 다음 데이터 로드
    //   if (scrollHeight - scrollTop - clientHeight < 100) {
    //     loadMoreNews();
    //   }
    // };
    // container.addEventListener('scroll', handleScroll);
    // return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 전체화면 모달 열기
  const openFullscreenModal = (video) => {
    setFullscreenVideoCategory(video);
    setIsFullscreenModalOpen(true);
  };

  // 전체화면 모달 닫기
  const closeFullscreenModal = () => {
    setIsFullscreenModalOpen(false);
    // 비디오 일시정지
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.pause();
    }
    setFullscreenVideoCategory(null);
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isFullscreenModalOpen) {
        closeFullscreenModal();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isFullscreenModalOpen]);

  // 메인 이미지 영역 높이에 맞춰 관심 보도자료 영역 높이 조정
  useEffect(() => {
    const updateSidebarHeight = () => {
      if (videoAreaRef.current && sidebarRef.current) {
        // 데스크톱에서만 높이 고정
        if (window.innerWidth >= 1024) {
          const imageHeight = videoAreaRef.current.offsetHeight;
          setSidebarHeight(`${imageHeight}px`);
        } else {
          setSidebarHeight("auto");
        }
      }
    };

    // 초기 높이 설정
    updateSidebarHeight();

    // 리사이즈 이벤트 리스너 추가
    window.addEventListener("resize", updateSidebarHeight);

    // 짧은 지연 후 다시 확인 (레이아웃 완료 후)
    const timer = setTimeout(updateSidebarHeight, 100);

    return () => {
      window.removeEventListener("resize", updateSidebarHeight);
      clearTimeout(timer);
    };
  }, []);

  // 시장 데이터 상태
  const [marketData, setMarketData] = useState({
    exchangeRates: {},
    koreanIndices: {},
    globalIndices: {},
    updatedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 시장 데이터 가져오기
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await apiClient.get("/api/market/latest");
        if (response.data) {
          setMarketData(response.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("시장 데이터 조회 실패:", error);
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

        // 첫 번째 카테고리를 기본 선택하고 10개 제한으로 데이터 가져오기
        if (categories && categories.length > 0) {
          const firstCategory = categories[0];
          setSelectedCategory(firstCategory);
          console.log("선택된 카테고리:", firstCategory);
          console.log("사용자 관심 카테고리:", categories);

          // 첫 번째 카테고리의 뉴스 10개만 가져오기
          const newsData = await getNewsByCategory(firstCategory, 10);
          if (newsData) {
            const limitedNews = (newsData || []).slice(0, 10);
            setBriefingNews(limitedNews);
            console.log("받아온 뉴스 데이터:", limitedNews);
          }
        }
      } catch (error) {
        console.error("사용자 데이터 조회 실패:", error);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchUserData();
  }, []);

  // 데이터 포맷팅 함수
  const formatNumber = (num) => {
    if (num == null) return "0";
    return typeof num === "number"
        ? num.toLocaleString("ko-KR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        : num;
  };

  const formatChange = (change) => {
    if (change == null || change === 0) return "";
    const sign = change > 0 ? "+" : "";
    return `${sign}${formatNumber(change)}`;
  };

  const formatChangePercent = (changePercent) => {
    if (changePercent == null || changePercent === 0) return "";
    const sign = changePercent > 0 ? "+" : "";
    return `${sign}${formatNumber(changePercent)}%`;
  };

  // 환율 데이터 추출
  const getExchangeRate = (code) => {
    const rate = marketData.exchangeRates?.[code];
    if (!rate) return { value: "0", change: "" };
    return {
      value: formatNumber(rate.rate),
      change: formatChange(rate.change),
    };
  };

  // 지수 데이터 추출
  const getIndex = (indices, symbol) => {
    const index = indices?.[symbol];
    if (!index) return { value: "0", change: "", changeValue: 0 };
    return {
      value: formatNumber(index.value),
      change: formatChange(index.change),
      changeValue: index.change || 0,
    };
  };

  // 경제 데이터 추출
  const economicData = {
    // 조선경제 (글로벌 지수에서 가져오거나 기본값)
    chosun: getIndex(marketData.globalIndices, "SPX"),
    // 환율 데이터
    dollar: getExchangeRate("USD"), // 달러
    yuan: getExchangeRate("CNY"), // 위안
    euro: getExchangeRate("EUR"), // 유로
    pound: getExchangeRate("GBP"), // 파운드
    yen: getExchangeRate("JPY"), // 원(엔)
    // 한국 지수
    kospi: getIndex(marketData.koreanIndices, "KS11"),
    kosdaq: getIndex(marketData.koreanIndices, "KQ11"),
    kospi200: marketData.koreanIndices?.KS11
        ? {
          value: formatNumber(
              (marketData.koreanIndices.KS11.value * 0.3).toFixed(2),
          ),
          change: formatChange(marketData.koreanIndices.KS11.change * 0.3),
          changeValue: (marketData.koreanIndices.KS11.change || 0) * 0.3,
        }
        : { value: "0", change: "", changeValue: 0 },
  };

  // 경제 지표 색상 결정 함수 (문자열용)
  const getEconomyColor = (changeStr) => {
    if (!changeStr) return "text-gray-900";
    const value = parseFloat(changeStr.replace(/[+,]/g, ""));
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-900";
  };

  // 경제 지표 색상 결정 함수 (숫자용)
  const getEconomyColorByValue = (changeValue) => {
    if (changeValue == null || changeValue === 0) return "";
    if (changeValue > 0) return "text-green-600";
    if (changeValue < 0) return "text-red-600";
    return "";
  };

  return (
      <div className="min-h-screen bg-white">
        {/* 경제 데이터 */}
        <section className="bg-white border-y border-gray-200 py-2 sm:py-3 px-2 sm:px-4 md:px-8 overflow-hidden mt-16 sm:mt-20">
          <div className="max-w-7xl mx-auto relative">
            {isLoading ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <span>시장 데이터를 불러오는 중...</span>
                </div>
            ) : (
                <div className="flex items-center">
              <span className="font-semibold text-gray-900 bg-white z-10 pr-2 sm:pr-4 whitespace-nowrap text-[10px] sm:text-xs">
                경제 &gt;
              </span>
                  <div className="flex-1 overflow-hidden relative h-5 sm:h-6">
                    <div className="flex items-center gap-4 sm:gap-6 md:gap-8 animate-marquee whitespace-nowrap absolute">
                      {/* 첫 번째 세트 */}
                      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        (USD)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.dollar.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.dollar.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        위안(CNY)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.yuan.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.yuan.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        유로(EUR)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.euro.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.euro.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        파운드(GBP)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.pound.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.pound.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        엔(JPY)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.yen.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.yen.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        코스피
                      </span>
                          <span
                              className={`${getEconomyColorByValue(economicData.kospi.changeValue)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.kospi.value}
                      </span>
                          {economicData.kospi.change && (
                              <span
                                  className={`text-[9px] sm:text-xs ${getEconomyColorByValue(economicData.kospi.changeValue)}`}
                              >
                          {economicData.kospi.change}
                        </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        코스닥
                      </span>
                          <span
                              className={`${getEconomyColorByValue(economicData.kosdaq.changeValue)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.kosdaq.value}
                      </span>
                          {economicData.kosdaq.change && (
                              <span
                                  className={`text-[9px] sm:text-xs ${getEconomyColorByValue(economicData.kosdaq.changeValue)}`}
                              >
                          {economicData.kosdaq.change}
                        </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        코스피200
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.kospi200.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.kospi200.value}
                      </span>
                          {economicData.kospi200.change && (
                              <span
                                  className={`text-[9px] sm:text-xs ${getEconomyColor(economicData.kospi200.change)}`}
                              >
                          {economicData.kospi200.change}
                        </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        S&P 500
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.chosun.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.chosun.value}
                      </span>
                        </div>
                      </div>

                      {/* 무한 루프를 위한 두 번째 동일 세트 */}
                      <div className="flex items-center gap-4 sm:gap-6 md:gap-8">
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        (USD)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.dollar.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.dollar.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        위안(CNY)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.yuan.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.yuan.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        유로(EUR)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.euro.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.euro.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        파운드(GBP)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.pound.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.pound.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        엔(JPY)
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.yen.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.yen.value}
                      </span>
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        코스피
                      </span>
                          <span
                              className={`${getEconomyColorByValue(economicData.kospi.changeValue)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.kospi.value}
                      </span>
                          {economicData.kospi.change && (
                              <span
                                  className={`text-[9px] sm:text-xs ${getEconomyColorByValue(economicData.kospi.changeValue)}`}
                              >
                          {economicData.kospi.change}
                        </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        코스닥
                      </span>
                          <span
                              className={`${getEconomyColorByValue(economicData.kosdaq.changeValue)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.kosdaq.value}
                      </span>
                          {economicData.kosdaq.change && (
                              <span
                                  className={`text-[9px] sm:text-xs ${getEconomyColorByValue(economicData.kosdaq.changeValue)}`}
                              >
                          {economicData.kosdaq.change}
                        </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        코스피200
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.kospi200.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.kospi200.value}
                      </span>
                          {economicData.kospi200.change && (
                              <span
                                  className={`text-[9px] sm:text-xs ${getEconomyColor(economicData.kospi200.change)}`}
                              >
                          {economicData.kospi200.change}
                        </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                      <span className="text-gray-700 text-[10px] sm:text-xs">
                        S&P 500
                      </span>
                          <span
                              className={`${getEconomyColor(economicData.chosun.change)} font-medium text-[10px] sm:text-xs`}
                          >
                        {economicData.chosun.value}
                      </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {marketData.updatedAt && (
                      <span className="text-[9px] sm:text-[10px] text-gray-400 bg-white z-10 pl-2 sm:pl-4 whitespace-nowrap">
                  {new Date(marketData.updatedAt).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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

        {/* 메인 콘텐츠 & 관심 보도자료 섹션 */}
        <section className="bg-white py-3 sm:py-4 md:py-5 px-2 sm:px-4 md:px-8">
          <div className="max-w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-3 sm:gap-4 lg:items-start">
            {/* 왼쪽: 3x2 비디오 그리드 영역 */}
            <div ref={videoAreaRef} className="relative w-full">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {/* 서버의 핫이슈 영상을 불러옵니다 */}
                {hotVideos.length > 0 ? (
                    hotVideos.slice(0, 6).map((video) => (
                        <div
                            key={video.vno}
                            className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-all bg-white"
                            onClick={() => openFullscreenModal(video)} // 이제 category 대신 video 객체를 넘깁니다
                        >
                          <div className="relative aspect-16/11 overflow-hidden bg-gray-100">
                            <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-1 bg-blue-600/90 text-white text-[10px] font-bold rounded shadow-sm">
                          AI 핫이슈
                        </span>
                            </div>
                            <video
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                // 서버에 저장된 실제 영상 경로입니다
                                src={`http://localhost:8080/upload/videos/${video.videoUrl}`}
                                onMouseEnter={(e) => {
                                  e.target.muted = false;
                                  e.target.play();
                                }}
                                onMouseLeave={(e) => {
                                  e.target.muted = true;
                                  e.target.pause();
                                  e.target.currentTime = 0;
                                }}
                            />
                          </div>
                          <div className="p-2">
                            <h3 className="font-semibold text-sm mb-0.5 line-clamp-1 leading-tight group-hover:text-blue-600">
                              {video.customTitle}
                            </h3>
                            <p className="text-[11px] text-gray-500">
                              ShortNews AI 리포트
                            </p>
                          </div>
                        </div>
                    ))
                ) : (
                    // 영상이 아직 없을 때 보여줄 화면
                    <div className="col-span-3 py-20 text-center text-gray-400">
                      {isLoadingHotVideos
                          ? "최신 핫이슈 영상을 가져오는 중입니다..."
                          : "현재 표시할 핫이슈 영상이 없습니다."}
                    </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 관심 보도자료 사이드바 */}
            <div
                ref={sidebarRef}
                className="bg-white rounded-lg flex flex-col min-h-0 lg:sticky lg:top-4"
                style={{ height: sidebarHeight }}
            >
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200 shrink-0">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    관심 보도자료
                  </h2>
                </div>

                {/* 카테고리 탭 */}
                <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 scrollbar-hide shrink-0">
                  {userCategories.length > 0 ? (
                      userCategories.map((category) => (
                          <button
                              key={category}
                              onClick={() => {
                                setSelectedCategory(category);
                                fetchNewsByCategory(category, true);
                              }}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                                  selectedCategory === category
                                      ? "bg-gray-800 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            {getCategoryDisplayName(category)}
                          </button>
                      ))
                  ) : (
                      <span className="text-xs sm:text-sm text-gray-500">
                    관심 카테고리를 선택해주세요
                  </span>
                  )}
                </div>

                {/* 뉴스 리스트 - 무한 스크롤 적용 */}
                {isLoadingNews ? (
                    <div className="flex items-center justify-center py-12 flex-1">
                  <span className="text-gray-500 text-sm">
                    뉴스를 불러오는 중...
                  </span>
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
                                  const dummyImageUrl = `https://via.placeholder.com/120x80/4B5563/FFFFFF?text=${encodeURIComponent(news.category || "News")}`;
                                  const imageUrl =
                                      news.imageUrl || news.thumbnailUrl || dummyImageUrl;

                                  return (
                                      <div
                                          key={news.id}
                                          className="flex gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group bg-white"
                                          onClick={() => {
                                            if (news.originalUrl) {
                                              window.open(news.originalUrl, "_blank");
                                            }
                                          }}
                                      >
                                        {/* 이미지 영역 */}
                                        <div className="shrink-0 w-24 h-20 sm:w-28 sm:h-24 rounded overflow-hidden bg-gray-100">
                                          <img
                                              src={imageUrl}
                                              alt={news.title || "뉴스 이미지"}
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
                                                  {news.summary
                                                      .replace(
                                                          /\[서론\]|\[본론\]|\[결론\]/g,
                                                          "",
                                                      )
                                                      .trim()}
                                                </p>
                                            )}
                                          </div>
                                          {news.date && (
                                              <p className="text-[10px] sm:text-xs text-gray-400 mt-auto">
                                                {(() => {
                                                  try {
                                                    const date = new Date(news.date);
                                                    if (isNaN(date.getTime())) return "";
                                                    return date.toLocaleDateString(
                                                        "ko-KR",
                                                        {
                                                          year: "numeric",
                                                          month: "short",
                                                          day: "numeric",
                                                        },
                                                    );
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
                            <span className="text-gray-400 text-xs sm:text-sm">
                              카테고리별 최대 10개까지 표시됩니다
                            </span>
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
        {isFullscreenModalOpen && fullscreenVideoCategory && (
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
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                  />
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
                    src={`http://localhost:8080/upload/videos/${fullscreenVideoCategory.videoUrl}`}
                >
                  <source
                      src={`http://localhost:8080/upload/videos/${fullscreenVideoCategory.videoUrl}`}
                      type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* 비디오 정보 */}
              <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10"
                  onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {videoData[fullscreenVideoCategory]?.title || "뉴스"}
                </h2>
                <p className="text-base sm:text-lg text-white/90">
                  {videoData[fullscreenVideoCategory]?.content || ""}
                </p>
              </div>
            </div>
        )}
      </div>
  );
};

export default MainPage;
