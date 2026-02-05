import { useState, useEffect, useRef } from "react";
import { getPlaylistImage } from "../utils/playlistImages";
import { formatNewsTitleWithCategory } from "../utils/categoryUtils";
import { CloseIcon, PlayIcon, MicrophoneIcon, HistoryIcon } from "./Icons";
import { VoiceVisualizer } from "./VoiceVisualizer";

/**
 * @param {Object[]} playlists - 플레이리스트 목록
 * @param {Function} onSelect - 플레이리스트 선택 핸들러
 * @param {boolean} isLoading - 로딩 상태
 * @param {Function} onRefresh - 새로고침 핸들러
 * @param {Function} onClose - 드라이브 모드 종료(원래 페이지로 돌아가기) 핸들러
 * @param {Object[]} historyList - 최근 청취 히스토리 목록
 * @param {Function} onHistoryLoad - 히스토리 새로고침
 * @param {Function} onHistoryItemPlay - 히스토리 항목 재생
 * @param {Function} onHistoryItemDelete - 히스토리 항목 삭제
 * @param {Function} onMicrophoneButtonClick - 마이크 버튼 누름 (음성/시연)
 * @param {Function} onMicrophoneButtonUp - 마이크 버튼 뗌
 * @param {number} audioLevel - 음성 레벨 (파장용)
 * @param {boolean} isRecording - 녹음/시연 인식 중 여부
 * @param {string} statusMessage - 상태 메시지
 * @param {string} recognizedText - 인식된 텍스트
 */
export function PlaylistSelection({
  playlists = [],
  onSelect,
  isLoading = false,
  onRefresh,
  onClose,
  historyList = [],
  onHistoryLoad,
  onHistoryItemPlay,
  onHistoryItemDelete,
  onMicrophoneButtonClick,
  onMicrophoneButtonUp,
  audioLevel = -60,
  isRecording = false,
  statusMessage = "",
  recognizedText = "",
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const toggleHistoryPanel = () => {
    const next = !showHistoryPanel;
    setShowHistoryPanel(next);
    if (next && onHistoryLoad) onHistoryLoad();
  };

  const handleSelect = (playlist, index) => {
    setSelectedIndex(index);
    if (onSelect) {
      onSelect(playlist);
    }
  };

  const goPrev = () => {
    if (playlists.length === 0) return;
    setSelectedIndex((i) => (i > 0 ? i - 1 : playlists.length - 1));
  };

  const goNext = () => {
    if (playlists.length === 0) return;
    setSelectedIndex((i) => (i < playlists.length - 1 ? i + 1 : 0));
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? e.clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches?.[0]?.clientX ?? e.clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  // 키보드: 좌우 화살표로 카드만 넘기기, 선택(재생)은 클릭으로만
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (playlists.length === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, playlists]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-6 p-8 max-w-sm mx-auto">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-amber-400/90 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="absolute -inset-1 rounded-3xl bg-amber-400/5 -z-10 blur-xl" />
          </div>
          <p className="text-white font-medium tracking-tight text-center">플레이리스트를 준비하고 있습니다</p>
        </div>
      </div>
    );
  }

  if (!playlists || playlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto p-4">
        <div className="text-white text-lg mb-4">플레이리스트가 없습니다</div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white"
          >
            닫기
          </button>
        )}
      </div>
    );
  }

  // 카드 배치·전환: 겹친 스택 + 기울임 + 중앙 기준 슬라이드 (드라이브 모드용)
  const CARD_WIDTH = 260;
  const CARD_HEIGHT = 320;
  const CARD_STEP = 160; // 겹침 강조 (STEP < WIDTH)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-y-auto p-4 md:p-6 flex flex-col">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0">
        {/* 헤더: 툴바 하나로 묶어 시각적 정리 */}
        <div className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
              Drive
            </span>
            <h1 className="text-white text-lg md:text-xl font-semibold tracking-tight truncate">
              뉴스 브리핑
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <div className="flex items-center rounded-2xl bg-white/[0.06] border border-white/10 p-1 gap-0.5">
              {(onHistoryItemPlay || onHistoryItemDelete) && (
                <button
                  type="button"
                  onClick={toggleHistoryPanel}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors flex-shrink-0 ${
                    showHistoryPanel ? "bg-amber-500/20 text-amber-300" : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                  title="청취 히스토리"
                  aria-label="히스토리"
                >
                  <HistoryIcon size={18} color="currentColor" />
                  <span className="text-sm font-medium hidden sm:inline">히스토리</span>
                </button>
              )}
              {onMicrophoneButtonClick && onMicrophoneButtonUp && (
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onMicrophoneButtonClick(); }}
                  onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); onMicrophoneButtonUp(); }}
                  onTouchStart={(e) => { e.stopPropagation(); onMicrophoneButtonClick(); }}
                  onTouchEnd={(e) => { e.stopPropagation(); onMicrophoneButtonUp(); }}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all flex-shrink-0 ${
                    isRecording ? "bg-sky-500/30 text-sky-300 animate-pulse" : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                  title="음성 명령"
                  aria-label="마이크"
                >
                  <MicrophoneIcon size={20} color="currentColor" />
                </button>
              )}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isLoading}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none ${
                    isLoading ? "animate-spin" : ""
                  }`}
                  title="새로고침"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M3 21V15M21 3v6M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                  </svg>
                </button>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-2 flex items-center justify-center w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                title="드라이브 모드 종료"
                aria-label="닫기"
              >
                <CloseIcon size={20} />
              </button>
            )}
          </div>
        </div>

        {/* 음성 인식 중: 파장 표시 */}
        {(onMicrophoneButtonClick && isRecording) && (
          <div className="mb-4 w-full max-w-md mx-auto space-y-2">
            <VoiceVisualizer audioLevel={audioLevel} isActive={isRecording} />
            {statusMessage && (
              <p className="text-center text-sm text-white/80">{statusMessage}</p>
            )}
          </div>
        )}
        {/* 상태 메시지: 녹음 중이 아닐 때도 표시 (예: "해당 카테고리의 뉴스가 없습니다.") */}
        {statusMessage && !isRecording && (
          <div className="mb-4 w-full max-w-md mx-auto">
            <p className="text-center text-sm text-amber-200/95 px-2 py-2 rounded-lg bg-amber-500/10 border border-amber-400/20">
              {statusMessage}
            </p>
          </div>
        )}
        {/* 인식된 텍스트: 녹음 종료 후 API 응답으로 표시 (3초 후 자동 제거) */}
        {recognizedText && (
          <p className="text-center text-sm text-sky-300/95 mb-2 px-2">"{recognizedText}"</p>
        )}

        {/* 메인: 큰 화면에서 세로 중앙에 오도록 flex-1 + justify-center */}
        <div className="flex-1 flex flex-col justify-center gap-4 md:gap-6 min-h-0 py-4 md:py-0">
          {/* 상단 행: [히스토리 패널(열릴 때만)] + [카드 영역] */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-0">
            {showHistoryPanel && (
              <div className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col rounded-xl border border-white/10 bg-slate-800/50 min-h-0 max-h-[50vh] md:max-h-[min(420px,70vh)] overflow-hidden">
                <div className="flex items-center justify-between py-2.5 px-4 flex-shrink-0 border-b border-white/10">
                  <h3 className="text-sm font-medium text-white/90">청취 히스토리</h3>
                  <div className="flex items-center gap-1">
                    {onHistoryLoad && (
                      <button type="button" onClick={onHistoryLoad} className="text-xs text-slate-500 hover:text-white py-1 px-1.5 rounded transition-colors">새로고침</button>
                    )}
                    <button type="button" onClick={() => setShowHistoryPanel(false)} className="text-xs text-slate-500 hover:text-white py-1 px-1.5 rounded transition-colors">닫기</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {!historyList || historyList.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-10">기록이 없습니다</div>
                ) : (
                  <div className="space-y-5">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      const groups = { today: [], yesterday: [], others: [] };
                      historyList.forEach((item) => {
                        if (!item.createdAt) {
                          groups.others.push(item);
                          return;
                        }
                        const d = new Date(item.createdAt);
                        d.setHours(0, 0, 0, 0);
                        if (d.getTime() === today.getTime()) groups.today.push(item);
                        else if (d.getTime() === yesterday.getTime()) groups.yesterday.push(item);
                        else groups.others.push(item);
                      });
                      const sections = [
                        { key: "today", label: "오늘", items: groups.today },
                        { key: "yesterday", label: "어제", items: groups.yesterday },
                        { key: "others", label: "이전 기록", items: groups.others },
                      ].filter((s) => s.items.length > 0);
                      return sections.map((section) => (
                        <div key={section.key} className="mb-4 last:mb-0">
                          <div className="text-[11px] font-medium text-slate-500 mb-1.5">{section.label}</div>
                          <div className="space-y-1.5">
                            {section.items.map((item) => (
                              <div
                                key={item.historyId || item.playlistId || Math.random()}
                                className="rounded-lg p-3 bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-base font-semibold text-white/90 mb-1">
                                      {item.playlistTitle || "플레이리스트"}
                                    </div>
                                    {item.newsList && Array.isArray(item.newsList) && item.newsList.length > 0 && (
                                      <div className="space-y-1 mt-2">
                                        {item.newsList.slice(0, 3).map((news, idx) => (
                                          <div key={idx} className="text-sm text-white/70 line-clamp-1">
                                            • {formatNewsTitleWithCategory(news.title || "제목 없음", news.category)}
                                          </div>
                                        ))}
                                        {item.newsList.length > 3 && (
                                          <div className="text-xs text-white/50">외 {item.newsList.length - 3}개</div>
                                        )}
                                      </div>
                                    )}
                                    {item.createdAt && (
                                      <div className="text-xs text-white/50 mt-2">
                                        {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {onHistoryItemPlay && (
                                      <button
                                        type="button"
                                        onClick={() => onHistoryItemPlay(item)}
                                        disabled={isLoading}
                                        className="w-9 h-9 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center justify-center transition-colors disabled:opacity-50"
                                        title="재생"
                                      >
                                        <PlayIcon size={18} />
                                      </button>
                                    )}
                                    {onHistoryItemDelete && item.historyId && (
                                      <button
                                        type="button"
                                        onClick={() => onHistoryItemDelete(item.historyId)}
                                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                                        title="삭제"
                                      >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
                </div>
              </div>
            )}

            {/* 카드 영역: 히스토리 닫으면 넓게, 열면 오른쪽에 (재생 화면과 동일) */}
            <div
              className="relative flex-1 min-w-0 flex flex-col items-center justify-start"
              style={{ minHeight: CARD_HEIGHT + 80 }}
            >
              <div
                className="relative w-full overflow-hidden touch-pan-y select-none flex justify-center"
                style={{ minHeight: CARD_HEIGHT }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="relative transition-transform duration-300 ease-out will-change-transform"
                  style={{
                    width: Math.max(1, playlists.length - 1) * CARD_STEP + CARD_WIDTH,
                    height: CARD_HEIGHT,
                    transform: `translateX(calc(50% - ${selectedIndex * CARD_STEP + CARD_WIDTH / 2}px))`,
                  }}
                >
                  {playlists.map((playlist, index) => {
                    const offset = index - selectedIndex;
                    const isSelected = offset === 0;
                    const scale = isSelected ? 1 : 0.82;
                    const zIndex = 50 + (playlists.length - Math.abs(offset));
                    const opacity = isSelected ? 1 : Math.max(0.5, 0.85 - Math.abs(offset) * 0.15);

                    return (
                      <div
                        key={playlist.id || index}
                        className="absolute cursor-pointer transition-all duration-300 ease-out rounded-2xl overflow-hidden"
                        style={{
                          left: index * CARD_STEP,
                          top: 0,
                          width: CARD_WIDTH,
                          height: CARD_HEIGHT,
                          transform: `scale(${scale})`,
                          transformOrigin: "center center",
                          zIndex,
                          opacity,
                        }}
                        onClick={() => handleSelect(playlist, index)}
                      >
                        <div
                          className={`w-full h-full rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
                            isSelected
                              ? "ring-2 ring-amber-400/60 shadow-[0_0_24px_rgba(251,191,36,0.15)]"
                              : "ring-1 ring-white/[0.06] shadow-lg shadow-black/20"
                          }`}
                        >
                          <div className="flex-1 min-h-0 relative flex items-center justify-center p-3 bg-slate-800/80">
                            <img
                              src={getPlaylistImage(playlist.id)}
                              alt={playlist.title}
                              className="w-full h-full object-cover rounded-xl"
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23475569' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='24'%3E플레이리스트%3C/text%3E%3C/svg%3E";
                              }}
                            />
                            {/* 이미지 하단 그라데이션으로 텍스트 가독성 확보 */}
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none rounded-b-xl" />
                          </div>
                          <div className="relative p-3 pt-2 flex-shrink-0 bg-slate-900/90 border-t border-white/[0.06]">
                            <h2 className="text-base font-semibold text-white truncate">{playlist.title}</h2>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{playlist.description}</p>
                            <p className="text-[11px] text-slate-500 mt-1">약 {playlist.expectedCount || 5}개</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 카드 넘기기: 카드 영역 바로 아래에 배치 */}
              <div className="flex flex-col items-center gap-4 mt-8 w-full">
                <div className="flex justify-center items-center gap-5">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="w-11 h-11 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                    aria-label="이전 카드"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <div className="flex gap-1.5 items-center">
                    {playlists.map((_, index) => (
                      <button
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${
                          index === selectedIndex ? "bg-amber-400 w-6" : "bg-white/20 w-1.5 hover:bg-white/30"
                        }`}
                        onClick={() => setSelectedIndex(index)}
                        aria-label={`플레이리스트 ${index + 1} 선택`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={goNext}
                    className="w-11 h-11 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                    aria-label="다음 카드"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 tracking-wide">좌우 스와이프 · 화살표로 카드 선택 · 카드를 클릭하면 재생</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
