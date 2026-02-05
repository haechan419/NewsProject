import React, { useState, useEffect, useRef, useMemo } from "react";
import { getMyCategories } from "@/api/categoryApi";
import { getNewsByCategory } from "@/api/userCategoryNewsApi";
import { exchangeRateApi } from "@/api/exchangeRateApi";
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

const MainPage = () => {
  const [rawVideos, setRawVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [briefingNews, setBriefingNews] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef(null);
  const videoAreaRef = useRef(null);

  // 데이터 로딩 로직 (동일)
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [videoRes, rateRes, catRes] = await Promise.all([
          apiClient.get("/api/ai/video/main-hot"),
          exchangeRateApi.getAllExchangeRates(),
          getMyCategories(),
        ]);
        if (videoRes.data) setRawVideos(videoRes.data);
        if (rateRes?.exchangeRates) setExchangeRates(rateRes.exchangeRates);
        if (catRes?.length > 0) {
          const news = await getNewsByCategory(catRes[0], 10);
          setBriefingNews(news || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAllData();
  }, []);

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
      {/* 1. 환율 바 */}
      <section className="bg-white border-y border-gray-100 py-3 px-8 h-12 flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center w-full text-[11px]">
          <span className="font-bold pr-4 text-blue-600">MARKET &gt;</span>
          <div className="flex-1 marquee-scroll text-gray-600">
            {exchangeRates.slice(0, 8).map((r, i) => (
              <span key={i} className="mx-4">
                {r.curUnit} <b>{parseFloat(r.dealBasR).toLocaleString()}</b>
              </span>
            ))}
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

          {/* 3. 사이드바 */}
          <aside className="bg-slate-50 rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-white font-bold text-sm">
              최신 브리핑
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {briefingNews.map((news) => (
                <div
                  key={news.id}
                  onClick={() => window.open(news.originalUrl)}
                  className="text-[12px] font-bold text-slate-700 hover:text-blue-600 cursor-pointer leading-snug"
                >
                  • {news.title}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <style>{`
        .marquee-scroll { display: flex; animation: marquee 40s linear infinite; width: max-content; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MainPage;
