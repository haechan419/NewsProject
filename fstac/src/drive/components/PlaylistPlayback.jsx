import { useState, useEffect, useRef } from "react";
import { formatNewsTitleWithCategory } from "../utils/categoryUtils";
import { getPlaylistImage } from "../utils/playlistImages";
import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  PrevIcon,
  CloseIcon,
  HistoryIcon,
  MicrophoneIcon,
} from "./Icons";
import { VoiceVisualizer } from "./VoiceVisualizer";

/**
 * @param {string} playlistTitle
 * @param {string} playlistImage
 * @param {Object[]} newsList
 * @param {string} audioUrl
 * @param {Function} onPlayPause
 * @param {Function} onClose
 * @param {Function} onBack
 * @param {Function} onHistoryOpen
 * @param {number} currentTime
 * @param {number} duration
 * @param {boolean} isPlaying
 * @param {Function} onSeek
 * @param {boolean} showHistory
 * @param {Object[]} historyList
 * @param {Function} onHistoryItemPlay
 * @param {Function} onHistoryItemDelete
 * @param {Function} onHistoryClose
 * @param {Function} onMicrophoneButtonClick
 * @param {Function} onMicrophoneButtonUp
 * @param {number} audioLevel
 * @param {boolean} isRecording
 * @param {string} statusMessage
 * @param {string} recognizedText
 */
export function PlaylistPlayback({
  playlistTitle,
  playlistImage,
  newsList = [],
  audioUrl,
  onPlayPause,
  onClose,
  onBack,
  onHistoryOpen,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  onSeek,
  showHistory = false,
  historyList = [],
  onHistoryItemPlay,
  onHistoryItemDelete,
  onHistoryClose,
  onMicrophoneButtonClick,
  onMicrophoneButtonUp,
  audioLevel = -60,
  isRecording = false,
  statusMessage = "",
  recognizedText = "",
}) {
  const [localCurrentTime, setLocalCurrentTime] = useState(currentTime);
  const progressBarRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalCurrentTime(currentTime);
    }
  }, [currentTime, isDragging]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressBarClick = (e) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = duration * percentage;
    if (onSeek) {
      onSeek(newTime);
    }
    setLocalCurrentTime(newTime);
  };

  const getProgressFromEvent = (e) => {
    if (!progressBarRef.current || !duration) return null;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clickX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    return duration * percentage;
  };

  const handleProgressBarMouseDown = (e) => {
    setIsDragging(true);
    const newTime = getProgressFromEvent(e);
    if (newTime !== null) {
      setLocalCurrentTime(newTime);
    }
  };

  const handleProgressBarMouseUp = (e) => {
    setIsDragging(false);
    const newTime = getProgressFromEvent(e);
    if (newTime !== null && onSeek) {
      onSeek(newTime);
      setLocalCurrentTime(newTime);
    }
  };

  const handleProgressBarTouchStart = (e) => {
    setIsDragging(true);
    const newTime = getProgressFromEvent(e);
    if (newTime !== null) {
      setLocalCurrentTime(newTime);
    }
  };

  const handleProgressBarTouchEnd = (e) => {
    setIsDragging(false);
    const newTime = getProgressFromEvent(e);
    if (newTime !== null && onSeek) {
      onSeek(newTime);
      setLocalCurrentTime(newTime);
    }
  };

  const handleProgressBarTouchMove = (e) => {
    if (isDragging) {
      const newTime = getProgressFromEvent(e);
      if (newTime !== null) {
        setLocalCurrentTime(newTime);
      }
    }
  };

  const progressPercentage = duration > 0 ? (localCurrentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white z-50 flex flex-col">
      {/* 상단 바 */}
      <div className="w-full px-4 md:px-8 py-4 md:py-6 flex justify-between items-center">
        <div className="text-lg md:text-xl font-bold uppercase tracking-wider">
          DRIVE MODE
        </div>
        <div className="flex items-center gap-3">
          {onHistoryOpen && (
            <button
              onClick={onHistoryOpen}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <HistoryIcon size={18} />
              <span className="text-sm font-semibold">히스토리</span>
            </button>
          )}
          {onMicrophoneButtonClick && onMicrophoneButtonUp && (
            <button
              onMouseDown={onMicrophoneButtonClick}
              onMouseUp={onMicrophoneButtonUp}
              onTouchStart={onMicrophoneButtonClick}
              onTouchEnd={onMicrophoneButtonUp}
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                isRecording ? "bg-blue-500/30 border-2 border-blue-400 animate-pulse" : "bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40"
              }`}
              title="음성 명령"
              aria-label="마이크"
            >
              <MicrophoneIcon size={22} color="#93C5FD" />
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-colors"
              title="뒤로가기"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
          {onClose && (
            <button
              onClick={() => {
                if (onClose) onClose();
              }}
              className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center transition-colors"
            >
              <CloseIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {(onMicrophoneButtonClick && isRecording) && (
        <div className="mb-4 w-full max-w-md mx-auto space-y-2">
          <VoiceVisualizer audioLevel={audioLevel} isActive={isRecording} />
          {statusMessage && (
            <p className="text-center text-sm text-white/80">{statusMessage}</p>
          )}
        </div>
      )}
      {statusMessage && !isRecording && (
        <div className="mb-4 w-full max-w-md mx-auto">
          <p className="text-center text-sm text-amber-200/95 px-2 py-2 rounded-lg bg-amber-500/10 border border-amber-400/20">
            {statusMessage}
          </p>
        </div>
      )}
      {recognizedText && (
        <p className="text-center text-sm text-sky-300/95 mb-2 px-2">&quot;{recognizedText}&quot;</p>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-8 pb-4 overflow-hidden">
        {/* 왼쪽: 뉴스 목록 또는 히스토리 */}
        <div className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-800/50 rounded-2xl p-4 md:p-6 overflow-y-auto border border-white/10">
          {showHistory ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold text-white/90">
                  청취 히스토리
                </h3>
                <button
                  onClick={onHistoryClose}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  닫기
                </button>
              </div>
              {historyList.length === 0 ? (
                <div className="text-sm text-white/50 text-center py-8">
                  기록이 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    // 날짜별 그룹화
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
                      if (d.getTime() === today.getTime()) {
                        groups.today.push(item);
                      } else if (d.getTime() === yesterday.getTime()) {
                        groups.yesterday.push(item);
                      } else {
                        groups.others.push(item);
                      }
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
                              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="text-base font-semibold text-white/90 mb-1">
                                    {item.playlistTitle || "플레이리스트"}
                                  </div>
                                  {item.newsList && Array.isArray(item.newsList) && item.newsList.length > 0 && (
                                    <div className="space-y-1 mt-2">
                                      {item.newsList.slice(0, 3).map((news, idx) => (
                                        <div
                                          key={idx}
                                          className="text-sm text-white/70 line-clamp-1"
                                        >
                                          • {formatNewsTitleWithCategory(news.title || "제목 없음", news.category)}
                                        </div>
                                      ))}
                                      {item.newsList.length > 3 && (
                                        <div className="text-xs text-white/50">
                                          외 {item.newsList.length - 3}개
                                        </div>
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
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {onHistoryItemPlay && (
                                    <button
                                      onClick={() => onHistoryItemPlay(item)}
                                      className="w-10 h-10 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 flex items-center justify-center transition-colors"
                                      title="재생"
                                    >
                                      <PlayIcon size={20} />
                                    </button>
                                  )}
                                  {onHistoryItemDelete && item.historyId && (
                                    <button
                                      onClick={() => onHistoryItemDelete(item.historyId)}
                                      className="w-10 h-10 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center transition-colors"
                                      title="삭제"
                                    >
                                      <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
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
            </>
          ) : (
            <>
              <h3 className="text-lg md:text-xl font-bold mb-4 text-white/90">
                {playlistTitle || "플레이리스트"}
              </h3>
              <div className="space-y-2">
                {newsList.map((news, index) => (
                  <div
                    key={news.newsId || index}
                    className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <div className="text-sm md:text-base font-medium text-white/90 line-clamp-2">
                      {formatNewsTitleWithCategory(news.title || "제목 없음", news.category)}
                    </div>
                  </div>
                ))}
                {newsList.length === 0 && (
                  <div className="text-sm text-white/50 text-center py-8">
                    뉴스가 없습니다
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 중앙: 플레이리스트 이미지 + 재생 컨트롤 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8">
          {/* 플레이리스트 이미지 */}
          <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20">
            <img
              src={playlistImage || getPlaylistImage('default')}
              alt={playlistTitle}
              className="w-full h-full object-cover"
              loading="eager"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23999' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='24'%3E플레이리스트%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>

          {/* 재생 컨트롤 */}
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => {}}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              title="이전"
            >
              <PrevIcon size={24} />
            </button>
            <button
              onClick={onPlayPause}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? "일시정지" : "재생"}
            >
              {isPlaying ? <PauseIcon size={32} /> : <PlayIcon size={32} />}
            </button>
            <button
              onClick={() => {}}
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              title="다음"
            >
              <NextIcon size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* 하단: 재생바 */}
      <div className="px-4 md:px-8 pb-4 md:pb-6">
        <div className="bg-slate-800/50 rounded-2xl p-4 md:p-6 border border-white/10">
          {/* 진행률 바 */}
          <div
            ref={progressBarRef}
            className="w-full h-2 bg-white/10 rounded-full cursor-pointer mb-3 relative touch-none"
            onClick={handleProgressBarClick}
            onMouseDown={handleProgressBarMouseDown}
            onMouseUp={handleProgressBarMouseUp}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={handleProgressBarTouchStart}
            onTouchEnd={handleProgressBarTouchEnd}
            onTouchMove={handleProgressBarTouchMove}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-all"
              style={{ left: `calc(${progressPercentage}% - 8px)` }}
            />
          </div>

          {/* 시간 표시 */}
          <div className="flex justify-between items-center text-sm md:text-base text-white/70">
            <span>{formatTime(localCurrentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
