import { useState, useEffect, useRef, useCallback } from "react";
import { driveApi } from "../api/driveApi";

/**
 * 드라이브 모드 오디오 재생 훅
 * TTS 오디오 재생, 동기화, 재시도 최적화 관리
 */
export function useDriveAudio(options = {}) {
  const {
    onSentenceEnd,
    onPlaybackEnd,
    onPlaybackStart,
    onPlaybackError,
    onRetryAttempt,
    syncInterval = 5000,
    userId = 1,
  } = options;

  const MAX_TTS_RETRIES = 2;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [currentNewsId, setCurrentNewsId] = useState(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const audioRef = useRef(null);
  const syncTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const playbackTimerRef = useRef(null);

  const playAudio = useCallback(
    async (audioUrl, newsId, startSentenceIdx = 0, retryAttempt = 0) => {
      if (!audioUrl || audioUrl.trim() === "") {
        console.error("오디오 URL이 비어있습니다:", audioUrl);
        setIsPlaying(false);
        setIsPaused(false);
        return;
      }

      if (audioRef.current && audioRef.current.src && !audioRef.current.paused) {
        if (currentNewsId === newsId && newsId !== null) return;
      }

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      if (audioRef.current) {
        const oldAudio = audioRef.current;
        oldAudio.pause();
        if (oldAudio.src && oldAudio.src.startsWith("blob:")) {
          URL.revokeObjectURL(oldAudio.src);
        }
        oldAudio.src = "";
        oldAudio.load();
        audioRef.current = null;
      }

      setIsPaused(false);
      setPlaybackProgress(0);

      try {
        const response = await fetch(audioUrl);
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          const errorResponse = await response.json();
          const errorMessage = errorResponse.error || errorResponse.message || 'TTS 생성에 실패했습니다';
          
          if ((errorResponse.code === 'TTS_GENERATION_FAILED' || response.status === 500) && retryAttempt < MAX_TTS_RETRIES) {
            const retryDelay = retryAttempt === 0 ? 3000 : 5000;
            onRetryAttempt?.(retryAttempt + 1, MAX_TTS_RETRIES, retryDelay);
            retryTimerRef.current = setTimeout(() => {
              playAudio(audioUrl, newsId, startSentenceIdx, retryAttempt + 1);
            }, retryDelay);
            return;
          }
          
          setIsPlaying(false);
          setIsPaused(false);
          onPlaybackError?.(newsId, {
            errorCode: 4,
            errorMessage: errorMessage,
            audioUrl: audioUrl,
            serverError: true,
            serverErrorCode: errorResponse.code
          });
          return;
        }
        
        if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
        
        const audioBlob = await response.blob();
        if (audioBlob.size === 0) throw new Error('빈 오디오 파일');
        
        const blobUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio();
        audioRef.current = audio;
        setCurrentNewsId(newsId);
        setCurrentSentenceIdx(startSentenceIdx);
        
        audio.src = blobUrl;
        audio.preload = "auto";
        
        // Blob URL 설정 보장
        if (!audio.src.startsWith('blob:') && audio.src !== blobUrl) {
          audio.src = blobUrl;
          await new Promise(resolve => setTimeout(resolve, 10));
          if (!audio.src.startsWith('blob:') && audio.src !== blobUrl) {
            audio.src = audioUrl; // Fallback
          }
        }
        
        const cleanupBlobUrl = () => {
          if (audioRef.current && audioRef.current.src === blobUrl) {
            URL.revokeObjectURL(blobUrl);
          }
        };
        
        audio.addEventListener("ended", cleanupBlobUrl);
        audio.addEventListener("error", cleanupBlobUrl);
        
        let hasStartedPlaying = false;
        let hasActuallyPlayed = false;
        let audioLoaded = false;
        
        const handlePlaySuccess = () => {
          hasActuallyPlayed = true;
          setIsPlaying(true);
          setIsPaused(false);
          if (newsId) onPlaybackStart?.(newsId);
        };
        const handlePlayFail = (err) => {
          setIsPlaying(false);
          if (err?.name === "NotAllowedError") {
            onPlaybackError?.(newsId, { errorCode: 0, autoplayBlocked: true });
          }
        };

        const handleCanPlayThrough = () => {
          if (hasStartedPlaying) return;
          hasStartedPlaying = true;
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audio.play().then(handlePlaySuccess).catch(handlePlayFail);
        };

        const handleLoadedMetadata = () => {
          setTimeout(() => {
            if (!hasStartedPlaying && audio.readyState >= 2 && audio.paused) {
              hasStartedPlaying = true;
              audio.removeEventListener("canplaythrough", handleCanPlayThrough);
              audio.play().then(handlePlaySuccess).catch(handlePlayFail);
            }
          }, 300);
        };

        audio.addEventListener("canplaythrough", handleCanPlayThrough);
        audio.addEventListener("loadedmetadata", () => {
          audioLoaded = true;
          handleLoadedMetadata();
        });

        audio.addEventListener("timeupdate", () => {
          if (audio.duration && !audio.paused) {
            const progress = (audio.currentTime / audio.duration) * 100;
            setPlaybackProgress(Math.min(progress, 100));
          }
        });

        audio.addEventListener("pause", () => {
          if (audioRef.current === audio) {
            setIsPaused(true);
            setIsPlaying(false);
          }
        });

        audio.addEventListener("play", () => {
          if (audioRef.current === audio) {
            setIsPlaying(true);
            setIsPaused(false);
          }
        });

        audio.addEventListener("ended", () => {
          setIsPlaying(false);
          setIsPaused(false);
          setPlaybackProgress(100);
          const actualNewsId = newsId !== null && newsId !== undefined ? newsId : currentNewsId;
          onPlaybackEnd?.(actualNewsId, currentSentenceIdx);
        });

        audio.addEventListener("error", (e) => {
          if (audioRef.current !== audio) return;

          if (audio.error) {
            const errorCode = audio.error.code;
            const errorMessages = {
              1: "사용자 중단",
              2: "네트워크 오류",
              3: "디코딩 오류",
              4: "형식 미지원",
            };
            const errorMessage = errorMessages[errorCode] || "알 수 없는 오류";
            const wasActuallyPlayed = hasActuallyPlayed || (audio.currentTime > 0 && audio.duration > 0);
            const wasLoaded = audioLoaded || audio.readyState >= 2;

            if (wasLoaded && errorCode === 4) {
              if (audioRef.current !== audio) return;
              setIsPlaying(true);
              setIsPaused(false);
              
              if (audio.duration > 0) {
                const startTime = Date.now();
                if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
                
                const updatePlaybackProgress = () => {
                  if (audioRef.current === audio) {
                    if (!audio.paused) {
                      const elapsed = (Date.now() - startTime) / 1000;
                      const newCurrentTime = Math.min(elapsed, audio.duration);
                      try { audio.currentTime = newCurrentTime; } catch (e) {}
                      setPlaybackProgress((newCurrentTime / audio.duration) * 100);
                      
                      if (newCurrentTime >= audio.duration) {
                        setIsPlaying(false);
                        setIsPaused(false);
                        const actualNewsId = newsId !== null && newsId !== undefined ? newsId : currentNewsId;
                        onPlaybackEnd?.(actualNewsId, currentSentenceIdx);
                        return;
                      }
                    }
                    playbackTimerRef.current = setTimeout(updatePlaybackProgress, 100);
                  }
                };
                playbackTimerRef.current = setTimeout(updatePlaybackProgress, 100);
              } else {
                if (audioRef.current !== audio) return;
                setIsPlaying(false);
                setIsPaused(false);
                onPlaybackError?.(newsId, { errorCode, errorMessage, wasActuallyPlayed, wasLoaded });
              }
              return;
            }

            if (audioRef.current !== audio) return;
            setIsPlaying(false);
            setIsPaused(false);
            onPlaybackError?.(newsId, { errorCode, errorMessage, wasActuallyPlayed, wasLoaded });
          } else {
            if (audioRef.current !== audio) return;
            setIsPlaying(false);
            setIsPaused(false);
            const actualNewsId = newsId !== null && newsId !== undefined ? newsId : currentNewsId;
            onPlaybackEnd?.(actualNewsId, currentSentenceIdx);
          }
        });

        audio.load();
        
      } catch (fetchError) {
        if (retryAttempt < MAX_TTS_RETRIES && (fetchError.message.includes('fetch') || fetchError.message.includes('network'))) {
          const retryDelay = retryAttempt === 0 ? 3000 : 5000;
          onRetryAttempt?.(retryAttempt + 1, MAX_TTS_RETRIES, retryDelay);
          retryTimerRef.current = setTimeout(() => {
            playAudio(audioUrl, newsId, startSentenceIdx, retryAttempt + 1);
          }, retryDelay);
          return;
        }
        
        setIsPlaying(false);
        setIsPaused(false);
        onPlaybackError?.(newsId, {
          errorCode: 2,
          errorMessage: fetchError.message,
          fetchError: fetchError.message
        });
      }
    },
    [currentSentenceIdx, onPlaybackEnd, onPlaybackStart, onPlaybackError, onRetryAttempt]
  );

  const togglePause = useCallback(() => {
    if (!audioRef.current) return;
    if (isPaused) {
      audioRef.current.play()
        .then(() => { setIsPaused(false); setIsPlaying(true); })
        .catch((err) => console.error("재개 실패:", err));
    } else {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  }, [isPaused]);

  const setVolume = useCallback((volume) => {
    if (audioRef.current) audioRef.current.volume = Math.max(0, Math.min(1, volume));
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    if (audioRef.current) audioRef.current.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src && audioRef.current.src.startsWith("blob:")) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentNewsId(null);
    setCurrentSentenceIdx(0);
    
    if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null; }
    if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
    if (playbackTimerRef.current) { clearTimeout(playbackTimerRef.current); playbackTimerRef.current = null; }
  }, []);

  useEffect(() => {
    if (isPlaying && !isPaused && currentNewsId) {
      syncTimerRef.current = setInterval(() => {
        driveApi.syncPlaybackState(userId, currentNewsId, currentSentenceIdx).catch(() => {});
      }, syncInterval);
    } else {
      if (syncTimerRef.current) { clearInterval(syncTimerRef.current); syncTimerRef.current = null; }
    }
    return () => { if (syncTimerRef.current) clearInterval(syncTimerRef.current); };
  }, [isPlaying, isPaused, currentNewsId, currentSentenceIdx, syncInterval, userId]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src && audioRef.current.src.startsWith("blob:")) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
      }
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, []);

  const simulatePlaybackEnd = useCallback(() => {
    onPlaybackEnd?.(null, 0);
  }, [onPlaybackEnd]);

  return {
    isPlaying, isPaused, currentSentenceIdx, currentNewsId, playbackProgress,
    playAudio, togglePause, setVolume, setPlaybackRate, stopAudio, simulatePlaybackEnd,
  };
}
