import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchUserInfoAsync } from "@/slices/authSlice";
import { getMyCategories } from "@/api/categoryApi";
import { getNewsByCategory } from "@/api/userCategoryNewsApi";
import { exchangeRateApi } from "@/api/exchangeRateApi";
import { stockIndexApi } from "@/api/stockIndexApi";
import apiClient from "@/api/axios";

const VIDEO_BASE_URL = "http://localhost:8080/upload/videos/";

const categoryMap = {
  politics: "정치",
  economy: "경제",
  culture: "문화",
  it: "IT/과학",
  society: "사회",
  world: "국제",
};

// 통화 코드를 한국어로 변환하는 매핑
const currencyNameMap = {
  USD: "미국 달러",
  EUR: "유로",
  GBP: "파운드",
  JPY: "엔",
  AED: "사우디아라비아 디르함",
  AUD: "호주 달러",
  BHD: "바레인 디나르",
  BND: "브루나이 달러",
  CAD: "캐나다 달러",
  CHF: "스위스 프랑",
  CNH: "중국 위안화",
  CNY: "중국 위안화",
  DKK: "덴마크 크로네",
  HKD: "홍콩 달러",
  IDR: "인도네시아 루피아",
  INR: "인도 루피",
  KRW: "한국 원",
  KWD: "쿠웨이트 디나르",
  MYR: "말레이시아 링깃",
  NOK: "노르웨이 크로네",
  NZD: "뉴질랜드 달러",
  PHP: "필리핀 페소",
  QAR: "카타르 리얄",
  SAR: "사우디아라비아 리얄",
  SEK: "스웨덴 크로나",
  SGD: "싱가포르 달러",
  THB: "태국 바트",
  VND: "베트남 동",
};

// 주요 통화 우선순위 (항상 먼저 표시)
const priorityCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];

const MainPage = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});
  const [rawVideos, setRawVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [stockIndices, setStockIndices] = useState([]);
  const prevExchangeRatesRef = useRef([]);
  const [myCategories, setMyCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [briefingNews, setBriefingNews] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef(null);
  const videoAreaRef = useRef(null);

  // 환율 데이터 가져오기 (실시간 데이터)
  const fetchExchangeRates = async (forceFetch = false) => {
    try {
      // 먼저 당일 데이터 시도
      let rateRes = await exchangeRateApi.getAllExchangeRates();

      // 데이터가 없거나 강제 수집 요청 시 실시간 데이터 수집
      if (forceFetch || !rateRes?.exchangeRates || rateRes.exchangeRates.length === 0) {
        console.log("[환율] 실시간 데이터 수집 시작");
        // 환율은 백엔드 스케줄러가 자동으로 수집하므로, 최근 날짜들을 시도
        const today = new Date();
        for (let i = 0; i <= 7; i++) {
          const pastDate = new Date(today);
          pastDate.setDate(today.getDate() - i);
          const dateStr = pastDate.toISOString().slice(0, 10).replace(/-/g, '');

          try {
            rateRes = await exchangeRateApi.getExchangeRatesByDate(dateStr);
            if (rateRes?.exchangeRates && rateRes.exchangeRates.length > 0) {
              console.log(`[환율] 데이터 조회 성공: ${dateStr}`);
              break;
            }
          } catch (err) {
            console.debug(`[환율] 날짜 ${dateStr} 조회 실패, 다음 날짜 시도`);
          }
        }
      }

      // 환율 데이터 설정
      if (rateRes?.exchangeRates && Array.isArray(rateRes.exchangeRates) && rateRes.exchangeRates.length > 0) {
        // 이전 환율 데이터 저장 (새 데이터 설정 전에)
        prevExchangeRatesRef.current = exchangeRates.length > 0 ? exchangeRates : rateRes.exchangeRates;
        setExchangeRates(rateRes.exchangeRates);
      } else {
        console.warn("[환율] 데이터를 불러올 수 없습니다:", rateRes);
        setExchangeRates([]);
      }
    } catch (e) {
      console.error("[환율] 데이터 로딩 실패:", e);
      setExchangeRates([]);
    }
  };

  // 주가지수 데이터 가져오기 (실시간 데이터 수집)
  const fetchStockIndices = async (forceFetch = false) => {
    try {
      console.log("[주가지수] 데이터 조회 시작");
      // 먼저 당일 데이터 시도
      let indexRes = await stockIndexApi.getAllStockIndices();
      console.log("[주가지수] API 응답:", indexRes);

      // 데이터가 없거나 강제 수집 요청 시 실시간 데이터 수집
      if (forceFetch || !indexRes?.stockIndices || indexRes.stockIndices.length === 0) {
        console.log("[주가지수] 실시간 데이터 수집 시작");
        try {
          // 실시간 데이터 수집 (API/크롤링)
          await stockIndexApi.fetchStockIndices();
          // 수집 후 다시 조회
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
          indexRes = await stockIndexApi.getAllStockIndices();
          console.log("[주가지수] 실시간 데이터 수집 후 조회 결과:", indexRes);
        } catch (fetchErr) {
          console.warn("[주가지수] 실시간 데이터 수집 실패:", fetchErr);
        }
      }

      // 주가지수 데이터 설정
      if (indexRes?.stockIndices && Array.isArray(indexRes.stockIndices) && indexRes.stockIndices.length > 0) {
        console.log("[주가지수] 데이터 설정 성공, 개수:", indexRes.stockIndices.length);
        console.log("[주가지수] 데이터 내용:", indexRes.stockIndices);
        setStockIndices(indexRes.stockIndices);
      } else {
        console.warn("[주가지수] 데이터를 불러올 수 없습니다. 응답:", indexRes);
        setStockIndices([]);
      }
    } catch (e) {
      console.error("[주가지수] 데이터 로딩 실패:", e);
      setStockIndices([]);
    }
  };

  // 데이터 로딩 로직
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 비디오 데이터는 항상 가져오기 (인증 불필요)
        try {
          const videoRes = await apiClient.get("/api/ai/video/main-hot");
          if (videoRes.data) setRawVideos(videoRes.data);
        } catch (e) {
          console.error("비디오 데이터 로딩 실패:", e);
        }

        // 환율 및 주가지수 데이터는 별도로 가져오기 (실시간 데이터 수집, 인증 불필요)
        await Promise.all([
          fetchExchangeRates(true), // 강제로 실시간 데이터 수집
          fetchStockIndices(true)   // 강제로 실시간 데이터 수집
        ]);

        // 관심 카테고리는 로그인한 사용자만 가져오기 (실패해도 계속 진행)
        try {
          const catRes = await getMyCategories();
          if (catRes?.length > 0) {
            setMyCategories(catRes);
            setSelectedCategory(catRes[0]);
            try {
              const news = await getNewsByCategory(catRes[0], 10);
              setBriefingNews(news || []);
            } catch (newsError) {
              console.warn("카테고리별 뉴스 로딩 실패:", newsError);
              setBriefingNews([]);
            }
          } else {
            // 카테고리가 없으면 기본 카테고리 사용
            const defaultCategories = ['politics', 'economy', 'culture', 'it', 'society', 'world'];
            setMyCategories(defaultCategories);
            setSelectedCategory(defaultCategories[0]);
            try {
              const news = await getNewsByCategory(defaultCategories[0], 10);
              setBriefingNews(news || []);
            } catch (newsError) {
              console.warn("기본 카테고리 뉴스 로딩 실패:", newsError);
              setBriefingNews([]);
            }
          }
        } catch (catError) {
          console.warn("관심 카테고리 조회 실패 (로그인하지 않은 사용자일 수 있음):", catError);
          // 로그인하지 않은 사용자를 위한 기본 카테고리 설정
          const defaultCategories = ['politics', 'economy', 'culture', 'it', 'society', 'world'];
          setMyCategories(defaultCategories);
          setSelectedCategory(defaultCategories[0]);
          try {
            const news = await getNewsByCategory(defaultCategories[0], 10);
            setBriefingNews(news || []);
          } catch (newsError) {
            console.warn("기본 카테고리 뉴스 로딩 실패:", newsError);
            setBriefingNews([]);
          }
        }
      } catch (e) {
        console.error("데이터 로딩 실패:", e);
      }
    };
    fetchAllData();
  }, []);

  // 로그인 상태 확인 및 사용자 정보 동기화
  useEffect(() => {
    const syncUserInfo = async () => {
      // 쿠키에 토큰이 있을 수 있으므로 사용자 정보 조회 시도
      // localStorage에 사용자 정보가 없거나 isAuthenticated가 false인 경우
      if (!user && !isAuthenticated) {
        try {
          // 사용자 정보 조회 시도 (실패해도 에러를 throw하지 않음)
          const result = await dispatch(fetchUserInfoAsync());
          if (fetchUserInfoAsync.fulfilled.match(result)) {
            console.log("메인페이지에서 사용자 정보 조회 성공");
          } else {
            // 로그인하지 않은 사용자는 정상적인 상황이므로 조용히 처리
            console.debug("사용자 정보 조회 실패 (로그인하지 않은 사용자일 수 있음)");
          }
        } catch (error) {
          // 로그인하지 않은 사용자는 정상적인 상황이므로 에러 무시
          // axios 인터셉터에서 이미 처리했을 수 있으므로 조용히 처리
          console.debug("사용자 정보 조회 실패 (로그인하지 않은 사용자일 수 있음):", error);
        }
      }
    };

    // 페이지 로드 후 약간의 지연을 두고 사용자 정보 확인
    // 다른 초기화 작업(데이터 로딩 등)이 완료된 후 실행
    const timer = setTimeout(() => {
      syncUserInfo();
    }, 1000); // 지연 시간 증가 (다른 초기화 작업 완료 대기)

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 로그인 상태가 변경될 때 관심 카테고리 로드
  useEffect(() => {
    const fetchMyCategories = async () => {
      if (!isAuthenticated) {
        // 로그인하지 않은 경우 기본 카테고리 설정
        const defaultCategories = ['politics', 'economy', 'culture', 'it', 'society', 'world'];
        setMyCategories(defaultCategories);
        setSelectedCategory(defaultCategories[0]);
        try {
          const news = await getNewsByCategory(defaultCategories[0], 10);
          setBriefingNews(news || []);
        } catch (newsError) {
          console.warn("기본 카테고리 뉴스 로딩 실패:", newsError);
          setBriefingNews([]);
        }
        return;
      }

      // 로그인한 사용자의 관심 카테고리 가져오기
      try {
        const catRes = await getMyCategories();
        if (catRes?.length > 0) {
          setMyCategories(catRes);
          setSelectedCategory(catRes[0]);
          try {
            const news = await getNewsByCategory(catRes[0], 10);
            setBriefingNews(news || []);
          } catch (newsError) {
            console.warn("카테고리별 뉴스 로딩 실패:", newsError);
            setBriefingNews([]);
          }
        } else {
          // 카테고리가 없으면 기본 카테고리 사용
          const defaultCategories = ['politics', 'economy', 'culture', 'it', 'society', 'world'];
          setMyCategories(defaultCategories);
          setSelectedCategory(defaultCategories[0]);
          try {
            const news = await getNewsByCategory(defaultCategories[0], 10);
            setBriefingNews(news || []);
          } catch (newsError) {
            console.warn("기본 카테고리 뉴스 로딩 실패:", newsError);
            setBriefingNews([]);
          }
        }
      } catch (catError) {
        console.warn("관심 카테고리 조회 실패:", catError);
        // 기본 카테고리 설정
        const defaultCategories = ['politics', 'economy', 'culture', 'it', 'society', 'world'];
        setMyCategories(defaultCategories);
        setSelectedCategory(defaultCategories[0]);
        try {
          const news = await getNewsByCategory(defaultCategories[0], 10);
          setBriefingNews(news || []);
        } catch (newsError) {
          console.warn("기본 카테고리 뉴스 로딩 실패:", newsError);
          setBriefingNews([]);
        }
      }
    };

    fetchMyCategories();
  }, [isAuthenticated]);

  // 주기적으로 환율 및 주가지수 데이터 갱신 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("[실시간] 환율 및 주가지수 데이터 갱신 시작");
      fetchExchangeRates(true);
      fetchStockIndices(true);
    }, 5 * 60 * 1000); // 5분마다

    return () => clearInterval(interval);
  }, []);

  // 선택된 카테고리 변경 시 뉴스 다시 로드
  useEffect(() => {
    if (selectedCategory) {
      const fetchNews = async () => {
        try {
          const news = await getNewsByCategory(selectedCategory, 10);
          setBriefingNews(news || []);
        } catch (e) {
          console.warn("뉴스 로딩 실패 (로그인하지 않은 사용자일 수 있음):", e);
          setBriefingNews([]);
        }
      };
      fetchNews();
    }
  }, [selectedCategory]);

  const hotVideos = useMemo(() => {
    const categories = Object.keys(categoryMap);
    return categories
      .map((cat) => rawVideos.find((v) => v.category?.toLowerCase() === cat))
      .filter(Boolean);
  }, [rawVideos]);

  // 카테고리별 비디오 인덱스 맵 (빠른 조회를 위해)
  const categoryIndexMap = useMemo(() => {
    const map = new Map();
    hotVideos.forEach((video, idx) => {
      if (video?.category) {
        map.set(video.category.toLowerCase(), idx);
      }
    });
    return map;
  }, [hotVideos]);

  const activeVideo = useMemo(
    () => hotVideos[currentVideoIndex] || null,
    [hotVideos, currentVideoIndex],
  );

  // --- [추가] 이전/다음 이동 함수 ---
  const goToPrevious = (e) => {
    e?.stopPropagation(); // 배경 재생/정지 이벤트 간섭 방지
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex((prev) => prev - 1);
      setIsPlaying(true);
    }
  };

  const goToNext = (e) => {
    e?.stopPropagation();
    if (currentVideoIndex < hotVideos.length - 1) {
      setCurrentVideoIndex((prev) => prev + 1);
      setIsPlaying(true);
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* 1. 환율 및 주가지수 바 */}
      <section className="bg-white border-y border-gray-100 py-3 px-8 h-12 flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center w-full text-[11px]">
          <span className="font-bold pr-4 text-blue-600 flex-shrink-0">MARKET &gt;</span>
          <div className="flex-1 overflow-hidden">
            <div className="market-scroll-wrapper flex items-center gap-4 whitespace-nowrap">
              {/* 원본 콘텐츠 */}
              <div className="market-scroll flex items-center gap-4">
                {/* 주가지수 표시 - 환율 앞에 표시 */}
                {stockIndices.length > 0 && stockIndices.map((index, i) => {
                  const clprValue = index.clpr
                    ? (typeof index.clpr === 'string'
                      ? parseFloat(index.clpr.replace(/,/g, ''))
                      : parseFloat(index.clpr))
                    : null;

                  const vsValue = index.vs
                    ? (typeof index.vs === 'string'
                      ? parseFloat(index.vs.replace(/,/g, ''))
                      : parseFloat(index.vs))
                    : null;

                  // 지수명을 한국어로 변환
                  const indexName = index.idxNm || index.mrktCls || 'N/A';

                  // 색상 결정 (전일 대비)
                  const isPositive = vsValue !== null && vsValue > 0;
                  const isNegative = vsValue !== null && vsValue < 0;
                  const colorClass = isPositive ? 'text-red-600' : isNegative ? 'text-blue-600' : '';

                  return (
                    <span key={index.mrktCls || i} className={`inline-block ${colorClass}`}>
                      {indexName} {clprValue ? clprValue.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : 'N/A'}
                    </span>
                  );
                })}

                {/* 환율 표시 - 주요 통화 우선 정렬 */}
                {exchangeRates.length > 0 && (() => {
                  // 주요 통화를 먼저 정렬
                  const sortedRates = [...exchangeRates].sort((a, b) => {
                    const aPriority = priorityCurrencies.indexOf(a.curUnit);
                    const bPriority = priorityCurrencies.indexOf(b.curUnit);
                    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
                    if (aPriority !== -1) return -1;
                    if (bPriority !== -1) return 1;
                    return 0;
                  });

                  return sortedRates.slice(0, 12).map((r, i) => {
                    const rateValue = r.dealBasR
                      ? (typeof r.dealBasR === 'string'
                        ? parseFloat(r.dealBasR.replace(/,/g, ''))
                        : parseFloat(r.dealBasR))
                      : null;

                    // 이전 환율과 비교하여 색상 결정
                    const prevRate = prevExchangeRatesRef.current.find(prev => prev.curUnit === r.curUnit);
                    const prevRateValue = prevRate?.dealBasR
                      ? (typeof prevRate.dealBasR === 'string'
                        ? parseFloat(prevRate.dealBasR.replace(/,/g, ''))
                        : parseFloat(prevRate.dealBasR))
                      : null;

                    const isRateUp = rateValue !== null && prevRateValue !== null && rateValue > prevRateValue;
                    const isRateDown = rateValue !== null && prevRateValue !== null && rateValue < prevRateValue;
                    const rateColorClass = isRateUp ? 'text-red-600' : isRateDown ? 'text-blue-600' : '';

                    // 통화 코드를 한국어로 변환 (curNm이 있으면 우선 사용, 없으면 매핑 사용)
                    const currencyName = r.curNm || currencyNameMap[r.curUnit] || r.curUnit || 'N/A';
                    return (
                      <span key={r.curUnit || `rate-${i}`} className={`inline-block ${rateColorClass}`}>
                        {currencyName} {rateValue ? rateValue.toLocaleString('ko-KR') : 'N/A'}
                      </span>
                    );
                  });
                })()}

                {/* 데이터가 없을 때 */}
                {stockIndices.length === 0 && exchangeRates.length === 0 && (
                  <span className="inline-block">시장 데이터를 불러오는 중...</span>
                )}
              </div>

              {/* 복제본 콘텐츠 (끊김 없이 이어지게 하기 위해) */}
              <div className="market-scroll flex items-center gap-4" aria-hidden="true">
                {/* 주가지수 표시 - 환율 앞에 표시 */}
                {stockIndices.length > 0 && stockIndices.map((index, i) => {
                  const clprValue = index.clpr
                    ? (typeof index.clpr === 'string'
                      ? parseFloat(index.clpr.replace(/,/g, ''))
                      : parseFloat(index.clpr))
                    : null;

                  const vsValue = index.vs
                    ? (typeof index.vs === 'string'
                      ? parseFloat(index.vs.replace(/,/g, ''))
                      : parseFloat(index.vs))
                    : null;

                  // 지수명을 한국어로 변환
                  const indexName = index.idxNm || index.mrktCls || 'N/A';

                  // 색상 결정 (전일 대비)
                  const isPositive = vsValue !== null && vsValue > 0;
                  const isNegative = vsValue !== null && vsValue < 0;
                  const colorClass = isPositive ? 'text-red-600' : isNegative ? 'text-blue-600' : '';

                  return (
                    <span key={`copy-${index.mrktCls || i}`} className={`inline-block ${colorClass}`}>
                      {indexName} {clprValue ? clprValue.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : 'N/A'}
                    </span>
                  );
                })}

                {/* 환율 표시 - 주요 통화 우선 정렬 */}
                {exchangeRates.length > 0 && (() => {
                  // 주요 통화를 먼저 정렬
                  const sortedRates = [...exchangeRates].sort((a, b) => {
                    const aPriority = priorityCurrencies.indexOf(a.curUnit);
                    const bPriority = priorityCurrencies.indexOf(b.curUnit);
                    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
                    if (aPriority !== -1) return -1;
                    if (bPriority !== -1) return 1;
                    return 0;
                  });

                  return sortedRates.slice(0, 12).map((r, i) => {
                    const rateValue = r.dealBasR
                      ? (typeof r.dealBasR === 'string'
                        ? parseFloat(r.dealBasR.replace(/,/g, ''))
                        : parseFloat(r.dealBasR))
                      : null;

                    // 이전 환율과 비교하여 색상 결정
                    const prevRate = prevExchangeRatesRef.current.find(prev => prev.curUnit === r.curUnit);
                    const prevRateValue = prevRate?.dealBasR
                      ? (typeof prevRate.dealBasR === 'string'
                        ? parseFloat(prevRate.dealBasR.replace(/,/g, ''))
                        : parseFloat(prevRate.dealBasR))
                      : null;

                    const isRateUp = rateValue !== null && prevRateValue !== null && rateValue > prevRateValue;
                    const isRateDown = rateValue !== null && prevRateValue !== null && rateValue < prevRateValue;
                    const rateColorClass = isRateUp ? 'text-red-600' : isRateDown ? 'text-blue-600' : '';

                    // 통화 코드를 한국어로 변환 (curNm이 있으면 우선 사용, 없으면 매핑 사용)
                    const currencyName = r.curNm || currencyNameMap[r.curUnit] || r.curUnit || 'N/A';
                    return (
                      <span key={`copy-rate-${r.curUnit || i}`} className={`inline-block ${rateColorClass}`}>
                        {currencyName} {rateValue ? rateValue.toLocaleString('ko-KR') : 'N/A'}
                      </span>
                    );
                  });
                })()}

                {/* 데이터가 없을 때 */}
                {stockIndices.length === 0 && exchangeRates.length === 0 && (
                  <span className="inline-block">시장 데이터를 불러오는 중...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 메인 비디오 영역 */}
      <section className="py-8 px-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div ref={videoAreaRef} className="flex flex-col">
            {/* 플레이어 컨테이너 */}
            <div
              className="relative rounded-2xl bg-black aspect-video lg:aspect-[21/9] overflow-hidden shadow-2xl group"
              onClick={togglePlay}
            >
              {activeVideo ? (
                <>
                  <video
                    ref={videoRef}
                    key={activeVideo.vno}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted={isMuted}
                    playsInline
                    onEnded={goToNext}
                  >
                    <source
                      src={`${VIDEO_BASE_URL}${activeVideo.videoUrl}`}
                      type="video/mp4"
                    />
                  </video>

                  {/* --- [추가] 이전 버튼: 인덱스가 0보다 클 때만 노출 --- */}
                  {currentVideoIndex > 0 && (
                    <button
                      onClick={goToPrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  )}

                  {/* --- [추가] 다음 버튼: 마지막 영상이 아닐 때만 노출 --- */}
                  {currentVideoIndex < hotVideos.length - 1 && (
                    <button
                      onClick={goToNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100"
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  )}

                  {/* 하단 컨트롤 및 제목 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                    <div className="flex items-center gap-4 text-white">
                      <button
                        onClick={togglePlay}
                        className="hover:text-blue-400"
                      >
                        {isPlaying ? (
                          <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-8 h-8"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                      <div>
                        <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                          {categoryMap[activeVideo.category] ||
                            activeVideo.category}
                        </span>
                        <h2 className="text-xl font-bold mt-1">
                          {activeVideo.customTitle}
                        </h2>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  데이터 로딩 중...
                </div>
              )}
            </div>

            {/* 하단 6칸 버튼 */}
            <div className="mt-6 grid grid-cols-6 gap-4">
              {Object.keys(categoryMap).map((catKey) => {
                const video = hotVideos.find(
                  (v) => v.category?.toLowerCase() === catKey,
                );
                const isActive =
                  activeVideo?.category?.toLowerCase() === catKey;
                const hasVideo = video !== undefined;
                return (
                  <button
                    key={catKey}
                    onClick={(e) => {
                      e.stopPropagation();
                      const idx = categoryIndexMap.get(catKey);
                      if (idx !== undefined && idx !== -1) {
                        setCurrentVideoIndex(idx);
                        setIsPlaying(true);
                        // 비디오 재생 시작
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play().catch(err => {
                            console.error("비디오 재생 실패:", err);
                          });
                        }
                      } else {
                        // 비디오가 없을 때도 피드백 제공
                        console.log(`[${categoryMap[catKey]}] 카테고리의 비디오가 없습니다.`);
                      }
                    }}
                    disabled={!hasVideo}
                    className={`relative py-3 rounded-xl border-2 transition-all duration-300 
                    ${isActive ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-200"}
                    ${!hasVideo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`text-xs font-bold ${isActive ? "text-blue-600" : hasVideo ? "text-gray-400" : "text-gray-300"}`}
                    >
                      {categoryMap[catKey]}
                    </span>
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                    )}
                    {!hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8px] text-gray-400">준비중</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 사이드바 - 관심 카테고리 */}
          <aside className="bg-slate-50 rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-white font-bold text-sm">
              관심 카테고리
            </div>
            {!isAuthenticated ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-[12px] text-gray-500 text-center">
                  로그인 후 사용 가능
                </div>
              </div>
            ) : myCategories.length > 0 ? (
              <>
                <div className="p-4 border-b bg-white flex flex-wrap gap-2">
                  {myCategories.map((category) => {
                    const displayName = categoryMap[category] || category;
                    const isSelected = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {briefingNews.length > 0 ? (
                    briefingNews.map((news) => (
                      <div
                        key={news.id}
                        onClick={() => window.open(news.originalUrl)}
                        className="text-[12px] font-bold text-slate-700 hover:text-blue-600 cursor-pointer leading-snug"
                      >
                        • {news.title}
                      </div>
                    ))
                  ) : (
                    <div className="text-[12px] text-gray-500 text-center py-4">
                      해당 카테고리의 뉴스가 없습니다.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-[12px] text-gray-500 text-center">
                  관심 카테고리를 설정해주세요.
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      <style>{`
        .market-scroll-wrapper {
          display: flex;
          width: 100%;
        }
        .market-scroll {
          display: inline-flex;
          animation: market-scroll 40s linear infinite;
          flex-shrink: 0;
        }
        @keyframes market-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .market-scroll-wrapper:hover .market-scroll {
          animation-play-state: paused;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MainPage;
