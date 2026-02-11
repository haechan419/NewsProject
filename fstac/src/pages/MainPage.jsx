import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
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
const priorityCurrencies = ["USD", "EUR", "GBP", "JPY"];

// --- [SVG 아이콘 객체] (추가 라이브러리 설치 불필요) ---
const Icons = {
  Play: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 3l14 9-14 9V3z" />
    </svg>
  ),
  Pause: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  ),
  Volume2: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
  VolumeX: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M23 9l-6 6M17 9l6 6" />
    </svg>
  ),
  Maximize: () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
};

const MainPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});

  // 데이터 상태
  const [rawVideos, setRawVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [stockIndices, setStockIndices] = useState([]);
  const prevExchangeRatesRef = useRef([]);
  const [myCategories, setMyCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [briefingNews, setBriefingNews] = useState([]);

  // --- [사용자 파트: 플레이어 제어 상태] ---
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef(null);
  const videoAreaRef = useRef(null);

  // --- [팀원 파트: 시장 데이터 수집 함수] ---
  const fetchExchangeRates = async (forceFetch = false) => {
    try {
      let rateRes = await exchangeRateApi.getAllExchangeRates();
      if (forceFetch || !rateRes?.exchangeRates?.length) {
        const today = new Date();
        for (let i = 0; i <= 7; i++) {
          const pastDate = new Date(today);
          pastDate.setDate(today.getDate() - i);
          const dateStr = pastDate.toISOString().slice(0, 10).replace(/-/g, "");
          rateRes = await exchangeRateApi.getExchangeRatesByDate(dateStr);
          if (rateRes?.exchangeRates?.length) break;
        }
      }
      if (rateRes?.exchangeRates) {
        prevExchangeRatesRef.current =
          exchangeRates.length > 0 ? exchangeRates : rateRes.exchangeRates;
        setExchangeRates(rateRes.exchangeRates);
      }
    } catch (e) {
      console.error("환율 로드 실패", e);
    }
  };

  const fetchStockIndices = async (forceFetch = false) => {
    try {
      let indexRes = await stockIndexApi.getAllStockIndices();
      if (forceFetch || !indexRes?.stockIndices?.length) {
        await stockIndexApi.fetchStockIndices();
        indexRes = await stockIndexApi.getAllStockIndices();
      }
      if (indexRes?.stockIndices) setStockIndices(indexRes.stockIndices);
    } catch (e) {
      console.error("주가지수 로드 실패", e);
    }
  };

  // --- [통합 데이터 로딩] ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const videoRes = await apiClient.get("/api/ai/video/main-hot");
        if (videoRes.data) setRawVideos(videoRes.data);
        await Promise.all([fetchExchangeRates(true), fetchStockIndices(true)]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAllData();
  }, []);

  // --- [팀원 파트: 자동 로그인 및 사용자 정보 동기화] ---
  useEffect(() => {
    if (!user && !isAuthenticated) {
      setTimeout(() => {
        dispatch(fetchUserInfoAsync());
      }, 1000);
    }
  }, [dispatch, user, isAuthenticated]);

  // --- [팀원 파트: 관심 카테고리 로직] ---
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catRes = await getMyCategories();
        const finalCats =
          catRes?.length > 0
            ? catRes
            : ["politics", "economy", "culture", "it", "society", "world"];
        setMyCategories(finalCats);
        setSelectedCategory(finalCats[0]);
      } catch (e) {
        const defaultCats = [
          "politics",
          "economy",
          "culture",
          "it",
          "society",
          "world",
        ];
        setMyCategories(defaultCats);
        setSelectedCategory(defaultCats[0]);
      }
    };
    loadCategories();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedCategory) {
      getNewsByCategory(selectedCategory, 10).then((news) =>
        setBriefingNews(news || []),
      );
    }
  }, [selectedCategory]);

  // --- [사용자 파트: 비디오 제어 핸들러] ---
  const togglePlay = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100 || 0,
      );
    }
  };

  const handleSeek = (e) => {
    const time = (e.target.value / 100) * videoRef.current.duration;
    videoRef.current.currentTime = time;
    setProgress(e.target.value);
  };

  const handleFullScreen = () => {
    const videoElement = videoRef.current;

    if (videoElement) {
      if (videoElement.requestFullscreen) {
        videoElement.requestFullscreen();
      } else if (videoElement.webkitRequestFullscreen) {
        // 사파리/구형 크롬 대응
        videoElement.webkitRequestFullscreen();
      } else if (videoElement.msRequestFullscreen) {
        // IE 대응
        videoElement.msRequestFullscreen();
      }
    }
  };

  const goToPrevious = (e) => {
    e?.stopPropagation();
    if (currentVideoIndex > 0) setCurrentVideoIndex((prev) => prev - 1);
  };

  const goToNext = (e) => {
    e?.stopPropagation();
    if (currentVideoIndex < hotVideos.length - 1)
      setCurrentVideoIndex((prev) => prev + 1);
  };

  const hotVideos = useMemo(() => {
    const categories = Object.keys(categoryMap);
    return categories
      .map((cat) => rawVideos.find((v) => v.category?.toLowerCase() === cat))
      .filter(Boolean);
  }, [rawVideos]);

  const activeVideo = useMemo(
    () => hotVideos[currentVideoIndex] || null,
    [hotVideos, currentVideoIndex],
  );

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* 1. 상단 마켓 티커 바 (팀원 로직 결과물) */}
      <section className="bg-white border-y border-gray-100 py-3 px-8 h-12 flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center w-full text-[11px]">
          <span className="font-bold pr-4 text-blue-600 flex-shrink-0">
            MARKET &gt;
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="market-scroll-wrapper flex items-center gap-4 whitespace-nowrap">
              <div className="market-scroll flex items-center gap-4">
                {stockIndices.map((idx, i) => (
                  <span key={`idx-${i}`} className="inline-block text-red-600">
                    {idx.idxNm} <b>{idx.clpr}</b>
                  </span>
                ))}
                {exchangeRates.slice(0, 10).map((r, i) => (
                  <span key={`rate-${i}`} className="inline-block">
                    {r.curUnit} <b>{r.dealBasR}</b>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 메인 콘텐츠 영역 (16:9 최적화 버전) */}
      <section className="py-8 px-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          {/* videoAreaRef는 레이아웃용, 실제 전체화면은 videoRef 사용 */}
          <div className="flex flex-col relative group">
            <div className="relative rounded-3xl bg-black aspect-video overflow-hidden shadow-2xl">
              {activeVideo ? (
                <>
                  <video
                    ref={videoRef} // 이 ref가 중요합니다!
                    key={activeVideo.vno}
                    className="w-full h-full object-cover cursor-pointer" // contain 대신 cover를 쓰면 미세한 여백도 사라집니다
                    autoPlay
                    muted={isMuted}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={goToNext}
                    onClick={togglePlay}
                  >
                    <source
                      src={`${VIDEO_BASE_URL}${activeVideo.videoUrl}`}
                      type="video/mp4"
                    />
                  </video>

                  {/* 좌우 네비게이션 화살표 */}
                  <button
                    onClick={goToPrevious}
                    className={`absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${currentVideoIndex === 0 && "hidden"}`}
                  >
                    <Icons.ChevronLeft />
                  </button>
                  <button
                    onClick={goToNext}
                    className={`absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${currentVideoIndex === hotVideos.length - 1 && "hidden"}`}
                  >
                    <Icons.ChevronRight />
                  </button>

                  {/* 하단 시네마틱 컨트롤 바 */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 text-left">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      className="w-full h-1.5 mb-6 accent-blue-500 cursor-pointer bg-white/20 rounded-full appearance-none"
                      onChange={handleSeek}
                    />
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-8">
                        <button
                          onClick={togglePlay}
                          className="hover:scale-110 transition-transform"
                        >
                          {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                        </button>

                        {/* 소리 조절 */}
                        <div className="flex items-center gap-3 group/vol">
                          <button
                            onClick={() => {
                              videoRef.current.muted = !isMuted;
                              setIsMuted(!isMuted);
                            }}
                          >
                            {isMuted ? <Icons.VolumeX /> : <Icons.Volume2 />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            className="w-0 group-hover/vol:w-24 transition-all duration-300 h-1 accent-white appearance-none bg-white/30 rounded"
                            onChange={(e) => {
                              videoRef.current.volume = e.target.value;
                              setVolume(e.target.value);
                              if (e.target.value > 0) setIsMuted(false);
                            }}
                          />
                        </div>

                        {/* ▼ [수정됨: 카테고리 + 뉴스 제목 노출] ▼ */}
                        <div className="border-l border-white/20 pl-6 flex flex-col">
                          <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-black uppercase tracking-widest w-fit mb-1">
                            {categoryMap[activeVideo.category] ||
                              activeVideo.category}
                          </span>
                          <h2 className="text-xl font-bold tracking-tight leading-tight">
                            {activeVideo.customTitle}
                          </h2>
                        </div>
                      </div>

                      <button
                        onClick={handleFullScreen}
                        className="hover:text-blue-400 p-2"
                      >
                        <Icons.Maximize />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  데이터 로딩 중...
                </div>
              )}
            </div>

            {/* 하단 6칸 버튼 (기존 유지) */}
            <div className="mt-8 grid grid-cols-6 gap-4">
              {Object.keys(categoryMap).map((catKey) => {
                const video = hotVideos.find(
                  (v) => v.category?.toLowerCase() === catKey,
                );
                const isActive =
                  activeVideo?.category?.toLowerCase() === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => {
                      const idx = hotVideos.findIndex(
                        (v) => v.category?.toLowerCase() === catKey,
                      );
                      if (idx !== -1) {
                        setCurrentVideoIndex(idx);
                        setIsPlaying(true);
                      }
                    }}
                    disabled={!video}
                    className={`py-3 rounded-xl border-2 transition-all ${isActive ? "border-blue-500 bg-blue-50 text-blue-600 font-bold" : "border-gray-100 text-gray-400"} ${!video && "opacity-30 cursor-not-allowed"}`}
                  >
                    {categoryMap[catKey]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 우측 사이드바 (팀원 파트: 뉴스 브리핑) */}
          <aside className="bg-slate-50 rounded-3xl p-6 border border-gray-100 overflow-hidden flex flex-col text-left">
            <div className="font-bold mb-4 text-sm text-slate-800 border-b pb-2">
              관심 카테고리 브리핑
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
              {isAuthenticated ? (
                briefingNews.map((news) => (
                  <div
                    key={news.id}
                    onClick={() => window.open(news.originalUrl)}
                    className="text-[12px] font-bold text-slate-700 hover:text-blue-600 cursor-pointer leading-tight"
                  >
                    • {news.title}
                  </div>
                ))
              ) : (
                <div className="text-[12px] text-gray-400 text-center py-10">
                  로그인 후 사용 가능합니다.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <style>{`
        .market-scroll { display: inline-flex; animation: market-scroll 45s linear infinite; }
        @keyframes market-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
        input[type='range']::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; background: #3b82f6; border-radius: 50%; border: 2px solid white; cursor: pointer; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MainPage;
