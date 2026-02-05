import { useEffect, useRef, useCallback, useState } from "react";
import { usePushToTalk } from "./hooks/usePushToTalk";
import { useDriveAudio } from "./hooks/useDriveAudio";
import { useDriveModeState } from "./hooks/useDriveModeState";
import { useDriveModeRefs } from "./hooks/useDriveModeRefs";
import { BentoGridHUD } from "./components/BentoGridHUD";
import { PlaylistSelection } from "./components/PlaylistSelection";
import { PlaylistPlayback } from "./components/PlaylistPlayback";
import { PlayIcon, TrashIcon } from "./components/Icons";
import { driveApi } from "./api/driveApi";

const DEMO_MP3_ENTRIES_SELECTION = [
  { key: 1, file: "select_interest.mp3", label: "오늘의 관심 뉴스", playlistIndex: 0 },
  { key: 2, file: "select_latest.mp3", label: "오늘의 주요 뉴스", playlistIndex: 1 },
  { key: 3, file: "select_economy.mp3", label: "경제·비즈니스 뉴스", playlistIndex: 2 },
  { key: 4, file: "select_politics.mp3", label: "정치·사회 뉴스", playlistIndex: 3 },
  { key: 5, file: "select_it.mp3", label: "IT·과학 뉴스", playlistIndex: 4 },
  { key: 6, file: "select_hot.mp3", label: "긴급 속보", playlistIndex: 5 },
];

const DEMO_MP3_ENTRIES_PLAYBACK = [
  { key: 1, file: "pause.mp3", label: "일시정지" },
  { key: 2, file: "resume.mp3", label: "재생" },
  { key: 3, file: "seek_forward.mp3", label: "10초 앞으로" },
  { key: 4, file: "help.mp3", label: "도움말" },
  { key: 5, file: "stop.mp3", label: "종료" },
];
const getDemoMp3Url = (filename) => new URL(`./demo/${filename}`, import.meta.url).href;

const RESUME_CHOICE_TIMEOUT_MS = 10000;
const MAX_INIT_RETRIES = 3;
const INIT_RETRY_DELAY_MS = 2000;
const MAX_COMMAND_RETRIES = 3;
const COMMAND_RETRY_DELAY_MS = 2000;
/** 선택 화면에서 음성 인식 후, 인식 텍스트를 보여준 뒤 재생 화면으로 넘기기까지 대기(ms) */
const SELECT_CONFIRM_DELAY_MS = 1500;

/**
 * @param {Object} props
 * @param {number} props.userId
 * @param {Function} props.onClose
 */
export function DriveModePage({ userId = 1, onClose }) {
  const testNoMicrophone = import.meta.env.VITE_TEST_NO_MICROPHONE === 'true';
  const testNoAudio = import.meta.env.VITE_TEST_NO_AUDIO === 'true';
  const demoVoice = import.meta.env.VITE_DEMO_VOICE === 'true';
  const [playlists, setPlaylists] = useState([]);
  const playlistsRef = useRef(playlists);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistNewsList, setPlaylistNewsList] = useState([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [showPlaylistSelection, setShowPlaylistSelection] = useState(true);
  const [currentPlaylistAudioUrl, setCurrentPlaylistAudioUrl] = useState(null);
  const [currentPlaylistHistoryId, setCurrentPlaylistHistoryId] = useState(null);

  const state = useDriveModeState();
  const refs = useDriveModeRefs();
  const {
    status, setStatus,
    statusMessage, setStatusMessage,
    recognizedText, setRecognizedText,
    currentNews, setCurrentNews,
    newsQueue, setNewsQueue,
    resumeInfo, setResumeInfo,
    briefingAudioUrl, setBriefingAudioUrl,
    djBriefingAudioUrl, setDjBriefingAudioUrl,
    isPlayingBriefing, setIsPlayingBriefing,
    history, setHistory,
    showResumeChoice, setShowResumeChoice,
    isHistoryPanelCollapsed, setIsHistoryPanelCollapsed,
    demoRecording, setDemoRecording,
    demoAudioLevel, setDemoAudioLevel,
    demoCommandKey, setDemoCommandKey,
    useDemoFallback, setUseDemoFallback,
  } = state;
  const {
    COMMAND_COOLDOWN,
    briefingAudioUrlRef,
    djBriefingAudioUrlRef,
    isPlayingBriefingRef,
    resumeInfoRef,
    showResumeChoiceRef,
    waitTimerRef,
    isPlayingNextNewsRef,
    lastProcessedNewsIdRef,
    pendingEntryDataRef,
    newsQueueRef,
    isMountedRef,
    fixedMessageAudioRef,
    fixedMessageSessionRef,
    enterDriveModeInProgressRef,
    initRetryCountRef,
    commandRetryCountRef,
    newsStartTimeRef,
    currentNewsIdRef,
    pausedTimeRef,
    totalPausedDurationRef,
    ttsFailureCountRef,
    lastCommandTimeRef,
    isProcessingCommandRef,
    commandRetryTimerRef,
    initRetryTimerRef,
    historyLoadTimerRef,
    nextNewsTimerRef,
    statusTimerRef,
    textHideTimerRef,
    demoLevelIntervalRef,
    demoLevelPhaseRef,
    demoKeyPressedThisSessionRef,
  } = refs;

  // Ref 동기화
  useEffect(() => { briefingAudioUrlRef.current = briefingAudioUrl; }, [briefingAudioUrl]);
  useEffect(() => { djBriefingAudioUrlRef.current = djBriefingAudioUrl; }, [djBriefingAudioUrl]);
  useEffect(() => { isPlayingBriefingRef.current = isPlayingBriefing; }, [isPlayingBriefing]);
  useEffect(() => { resumeInfoRef.current = resumeInfo; }, [resumeInfo]);
  useEffect(() => { showResumeChoiceRef.current = showResumeChoice; }, [showResumeChoice]);
  useEffect(() => { newsQueueRef.current = newsQueue; }, [newsQueue]);

  // 데모 모드 키보드 이벤트 (1~6): 숫자 키를 누른 뒤 마이크를 떼면 해당 명령 실행
  useEffect(() => {
    if (!demoVoice && !useDemoFallback) return;
    const onKey = (e) => {
      const k = parseInt(e.key);
      const maxKey = showPlaylistSelection ? 6 : 5;
      if (k >= 1 && k <= maxKey) {
        demoKeyPressedThisSessionRef.current = true;
        setDemoCommandKey(k);
        if (demoVoice) {
          const entries = showPlaylistSelection ? DEMO_MP3_ENTRIES_SELECTION : DEMO_MP3_ENTRIES_PLAYBACK;
          const entry = entries.find(ent => ent.key === k);
          console.log(`[데모 모드] 명령 ${k} 선택: ${entry?.label || "알 수 없음"}`);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demoVoice, useDemoFallback, showPlaylistSelection]);

  // 데모 모드 오디오 레벨 애니메이션
  useEffect(() => {
    if (!demoRecording) {
      if (demoLevelIntervalRef.current) {
        clearInterval(demoLevelIntervalRef.current);
        demoLevelIntervalRef.current = null;
      }
      setDemoAudioLevel(-60);
      return;
    }
    const BASE_DB = -38;
    const AMPLITUDE = 8;
    const SPEED = 0.15;
    demoLevelIntervalRef.current = setInterval(() => {
      demoLevelPhaseRef.current += SPEED;
      const t = demoLevelPhaseRef.current;
      const wave = Math.sin(t) * 0.6 + Math.sin(t * 2.3) * 0.4;
      const db = BASE_DB + wave * AMPLITUDE;
      setDemoAudioLevel(db);
    }, 80);
    return () => {
      if (demoLevelIntervalRef.current) clearInterval(demoLevelIntervalRef.current);
    };
  }, [demoRecording]);

  // Push-to-Talk 훅
  const { isRecording, audioLevel, startRecording, stopRecording } = usePushToTalk({
    maxDuration: 10000,
    onRecordingStart: () => {
      console.log("[Push-to-Talk] 녹음 시작");
      setStatus("recording");
      setStatusMessage("말씀해주세요... (말이 멈추면 자동 종료)");
      if (isPlaying && !isPaused && currentNewsId) setVolume(0.2);
    },
    onRecordingEnd: () => console.log("[Push-to-Talk] 녹음 종료"),
  });

  // 오디오 재생 훅
  const {
    isPlaying, isPaused, currentSentenceIdx, currentNewsId, playbackProgress,
    playAudio, togglePause, setVolume, stopAudio, simulatePlaybackEnd,
  } = useDriveAudio({
    userId,
    onRetryAttempt: (currentAttempt, maxAttempts) => {
      setStatus("processing");
      setStatusMessage(`음성 생성 중... (재시도 ${currentAttempt}/${maxAttempts})`);
    },
    onPlaybackError: (newsId, errorInfo) => {
      // 브라우저 자동 재생 정책 차단 시 안내
      if (errorInfo.autoplayBlocked === true) {
        setStatusMessage("재생을 위해 화면을 한 번 클릭해주세요.");
        setStatus("idle");
        return;
      }
      // 테스트 모드 처리
      if (testNoAudio && !errorInfo.testMode) {
        errorInfo = { ...errorInfo, errorCode: 4, errorMessage: '오디오 형식을 지원하지 않습니다', testMode: true };
      }
      
      console.error("오디오 재생 실패:", errorInfo);
      const isServerError = errorInfo.serverError === true;
      let userFriendlyMessage = "";

      if (isServerError) {
        userFriendlyMessage = errorInfo.serverErrorCode === 'TTS_GENERATION_FAILED' 
          ? "음성 생성에 실패했습니다. Python 서버가 실행 중인지 확인해주세요."
          : (errorInfo.errorMessage || "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } else {
        if (errorInfo.errorCode === 2) userFriendlyMessage = "네트워크 연결을 확인해주세요.";
        else if (errorInfo.errorCode === 4) userFriendlyMessage = "오디오 출력 장치가 없을 수 있습니다. 재생은 계속됩니다.";
        else userFriendlyMessage = errorInfo.errorMessage || "오디오 재생에 실패했습니다.";
      }
      
      ttsFailureCountRef.current += 1;
      
      // 브리핑/안내 멘트 재생 실패 처리
      if (newsId === null) {
        setIsPlayingBriefing(false);
        setBriefingAudioUrl(null);
        briefingAudioUrlRef.current = null;
        isPlayingBriefingRef.current = false;
        
        const currentResumeInfo = resumeInfoRef.current;
        const currentShowResumeChoice = showResumeChoiceRef.current;
        
        if (currentResumeInfo && currentResumeInfo.newsId && !currentShowResumeChoice) {
          if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
          setShowResumeChoice(true);
          showResumeChoiceRef.current = true;
          setStatusMessage("이전에 듣던 뉴스를 이어서 들으시겠습니까?");
          setStatus("idle");
          waitTimerRef.current = setTimeout(() => {
            waitTimerRef.current = null;
            setStatusMessage("이어듣기 선택 시간이 지났습니다. 이어듣기를 자동으로 시작합니다.");
            if (resumeInfoRef.current?.newsId) {
              // TODO: 플레이리스트 방식에서는 이어듣기 기능 제거됨 - 주석 처리
              // playFixedMessage("RESUME_TIMEOUT_AUTO").then(() => handleResumeChoice("resume")).catch(() => handleResumeChoice("resume"));
              handleResumeChoice("resume");
            } else {
              setShowResumeChoice(false);
              showResumeChoiceRef.current = false;
              setStatusMessage("이어듣기 선택 시간이 지났습니다. 다음 뉴스로 넘어갑니다.");
              // TODO: 플레이리스트 방식에서는 이어듣기 기능 제거됨 - 주석 처리
              // playFixedMessage("RESUME_TIMEOUT_NEXT").then(() => {
              if (newsQueueRef.current?.length > 0 && nextNewsTimerRef.current == null) {
                nextNewsTimerRef.current = setTimeout(() => playNextNews(), 500);
              }
              // }).catch(() => {
              //   if (newsQueueRef.current?.length > 0 && nextNewsTimerRef.current == null) {
              //     nextNewsTimerRef.current = setTimeout(() => playNextNews(), 500);
              //   }
              // });
            }
          }, RESUME_CHOICE_TIMEOUT_MS);
          return;
        }
        
        if (currentShowResumeChoice) return;
        
        if (errorInfo.errorCode === 4 && !isServerError) {
          console.warn("오디오 출력 장치 없음 경고. 진행 계속.");
          setStatusMessage("오디오 출력 장치가 없을 수 있습니다. 재생은 계속됩니다.");
          setStatus("idle");
          if (newsQueue && newsQueue.length > 0) {
            if (nextNewsTimerRef.current) clearTimeout(nextNewsTimerRef.current);
            nextNewsTimerRef.current = setTimeout(() => playNextNews(), 1000);
          }
          return;
        }
        
        setStatusMessage(userFriendlyMessage);
        setStatus("error");
        return;
      }
      
      // 오디오 출력 장치 미연결 시 (재생 유지)
      if (errorInfo.errorCode === 4 && !isServerError && newsId && errorInfo.wasLoaded) {
        setStatusMessage("오디오 출력 장치가 없습니다. 재생은 계속됩니다.");
        setStatus("playing");
        return;
      }
      
      // 오디오 로드 실패 시 (재시도는 훅 내부에서 처리되지만, 실패 시 UI 업데이트)
      if (errorInfo.errorCode === 4 && !isServerError && newsId && !errorInfo.wasLoaded) {
        setStatusMessage("오디오를 준비하는 중...");
        setStatus("processing");
        return;
      }
      
      // 반복 실패 시 중단
      if (ttsFailureCountRef.current >= 3) {
        setStatusMessage("뉴스 재생에 문제가 발생했습니다. Python 서버 연결을 확인해주세요.");
        setStatus("error");
        ttsFailureCountRef.current = 0;
        return;
      }
      
      // 다음 뉴스로 전환 시도
      if (newsId && newsQueue && newsQueue.length > 0) {
        setStatusMessage("다음 뉴스로 넘어갑니다...");
        setStatus("processing");
        if (nextNewsTimerRef.current) clearTimeout(nextNewsTimerRef.current);
        nextNewsTimerRef.current = setTimeout(() => playNextNews(), 2000);
      } else {
        setStatusMessage(userFriendlyMessage);
        setStatus("error");
      }
    },
    onPlaybackEnd: (newsId, sentenceIdx) => {
      // 브리핑/안내 멘트 종료 처리
      if (newsId === null) {
        const currentResumeInfo = resumeInfoRef.current;
        const currentShowResumeChoice = showResumeChoiceRef.current;
        
        if (currentShowResumeChoice) return;
        if (currentNewsId) return; // 뉴스 재생 중 오동작 방지
        
        if (briefingAudioUrlRef.current && isPlayingBriefingRef.current) {
          const isWelcomeMessage = pendingEntryDataRef.current !== null;
          
          if (isWelcomeMessage && pendingEntryDataRef.current) {
            const data = pendingEntryDataRef.current;
            pendingEntryDataRef.current = null;
            
            setIsPlayingBriefing(false);
            setBriefingAudioUrl(null);
            briefingAudioUrlRef.current = null;
            isPlayingBriefingRef.current = false;
            
            if (data.scenario === "RESUME_BRIEFING") {
              setStatusMessage("이전에 듣던 뉴스를 이어서 들으시겠습니까?");
              if (data.newsId && data.lastSentenceIdx !== undefined) {
                const resumeNews = {
                  newsId: data.newsId,
                  title: data.resumeNewsTitle || "이전 뉴스",
                  category: "이어듣기",
                };
                setCurrentNews(resumeNews);
                setResumeInfo({ newsId: data.newsId, lastSentenceIdx: data.lastSentenceIdx });
              }
              
              if (data.briefingAudioUrl) {
                setBriefingAudioUrl(data.briefingAudioUrl);
                briefingAudioUrlRef.current = data.briefingAudioUrl;
                setIsPlayingBriefing(true);
                isPlayingBriefingRef.current = true;
                setStatus("processing");
                setStatusMessage("안내 멘트를 재생합니다...");
                playAudio(data.briefingAudioUrl, null, 0);
              } else {
                // Fallback
                const fallbackUrl = `/api/drive/tts/script?text=${encodeURIComponent("이전에 듣던 뉴스를 이어서 들을까요?")}&voiceType=nova&speed=1.0`;
                setBriefingAudioUrl(fallbackUrl);
                briefingAudioUrlRef.current = fallbackUrl;
                setIsPlayingBriefing(true);
                isPlayingBriefingRef.current = true;
                playAudio(fallbackUrl, null, 0);
              }
              return;
            } else if (data.scenario === "NEW_BRIEFING" || data.scenario === "FIRST_TIME_WELCOME") {
              if (data.newsQueue) {
                const newsQueueArray = data.newsQueue.personalNews.concat([data.newsQueue.hotNews]);
                setNewsQueue(newsQueueArray);
                newsQueueRef.current = newsQueueArray;
              }
              
              if (data.briefingAudioUrl && !isPlayingBriefing && !briefingAudioUrlRef.current) {
                setBriefingAudioUrl(data.briefingAudioUrl);
                briefingAudioUrlRef.current = data.briefingAudioUrl;
                setIsPlayingBriefing(true);
                isPlayingBriefingRef.current = true;
                setStatus("processing");
                setStatusMessage(data.scenario === "FIRST_TIME_WELCOME" ? "안녕하세요, 드라이브 모드 뉴스 브리핑을 시작합니다" : "새로운 뉴스 브리핑을 시작합니다");
                
                if (testNoAudio && simulatePlaybackEnd) {
                  pendingEntryDataRef.current = null;
                  setTimeout(() => {
                    if (isMountedRef.current) simulatePlaybackEnd();
                  }, 800);
                } else {
                  playAudio(data.briefingAudioUrl, null, 0);
                }
              }
            }
            return;
          }
          
          // 멘트 재생 완료 처리
          setIsPlayingBriefing(false);
          setBriefingAudioUrl(null);
          briefingAudioUrlRef.current = null;
          isPlayingBriefingRef.current = false;
          
          if (currentResumeInfo && currentResumeInfo.newsId && !currentShowResumeChoice) {
            if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
            setShowResumeChoice(true);
            showResumeChoiceRef.current = true;
            setStatus("idle");
            setStatusMessage("이전에 듣던 뉴스를 이어서 들을까요?");
            waitTimerRef.current = setTimeout(() => {
              waitTimerRef.current = null;
              setStatusMessage("이어듣기 선택 시간이 지났습니다. 이어듣기를 자동으로 시작합니다.");
              if (resumeInfoRef.current?.newsId) {
                playFixedMessage("RESUME_TIMEOUT_AUTO").then(() => handleResumeChoice("resume")).catch(() => handleResumeChoice("resume"));
              } else {
                setShowResumeChoice(false);
                showResumeChoiceRef.current = false;
                setStatusMessage("이어듣기 선택 시간이 지났습니다. 다음 뉴스로 넘어갑니다.");
                playFixedMessage("RESUME_TIMEOUT_NEXT").then(() => {
                  if (newsQueueRef.current?.length > 0 && nextNewsTimerRef.current == null) {
                    nextNewsTimerRef.current = setTimeout(() => playNextNews(), 500);
                  }
                }).catch(() => {
                  if (newsQueueRef.current?.length > 0 && nextNewsTimerRef.current == null) {
                    nextNewsTimerRef.current = setTimeout(() => playNextNews(), 500);
                  }
                });
              }
            }, RESUME_CHOICE_TIMEOUT_MS);
            return;
          }
          
          if (currentShowResumeChoice) return;
          
          const queue = newsQueueRef.current;
          if (queue && queue.length > 0) {
            if (nextNewsTimerRef.current) clearTimeout(nextNewsTimerRef.current);
            nextNewsTimerRef.current = setTimeout(() => playNextNews(), 200);
            return;
          } else {
            if (newsQueue && newsQueue.length > 0) {
              newsQueueRef.current = newsQueue;
              if (nextNewsTimerRef.current) clearTimeout(nextNewsTimerRef.current);
              nextNewsTimerRef.current = setTimeout(() => playNextNews(), 200);
              return;
            }
            setStatus("idle");
            setStatusMessage("플레이리스트 재생을 완료했습니다.");
            playFixedMessage("PLAYLIST_COMPLETED");
            return;
          }
        }
        
        // 에러 반복 방지
        if (ttsFailureCountRef.current >= 3) {
          setStatusMessage("뉴스 재생에 문제가 발생했습니다");
          setStatus("error");
          playFixedMessage("TTS_RETRY");
          // TODO: 플레이리스트 방식에서는 NEXT_NEWS_SUGGESTION 제거됨
          ttsFailureCountRef.current = 0;
          return;
        }
        
        // 이어듣기 자동 재생 또는 다음 뉴스 재생
        const resumeInfoForPlayback = resumeInfoRef.current;
        if (resumeInfoForPlayback && resumeInfoForPlayback.newsId && !currentShowResumeChoice) {
          try {
            const audioUrl = `/api/drive/tts?newsId=${resumeInfoForPlayback.newsId}&voiceType=nova&speed=1.0&startSentenceIdx=${resumeInfoForPlayback.lastSentenceIdx || 0}`;
            ttsFailureCountRef.current = 0;
            setResumeInfo(null);
            resumeInfoRef.current = null;
            playAudio(audioUrl, resumeInfoForPlayback.newsId, resumeInfoForPlayback.lastSentenceIdx || 0);
          } catch (error) {
            console.error("이어듣기 재생 실패:", error);
            ttsFailureCountRef.current += 1;
            setStatus("error");
            setResumeInfo(null);
            if (newsQueue && newsQueue.length > 0) {
              if (nextNewsTimerRef.current) clearTimeout(nextNewsTimerRef.current);
              nextNewsTimerRef.current = setTimeout(() => playNextNews(), 2000);
            }
          }
        } else if (newsQueue && newsQueue.length > 0) {
          playNextNews();
        } else {
          setStatusMessage("");
        }
      } else {
        // 뉴스 재생 종료 처리
        if (ttsFailureCountRef.current >= 3) {
          setStatusMessage("뉴스 재생에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
          setStatus("error");
          ttsFailureCountRef.current = 0;
          return;
        }
        
        if (lastProcessedNewsIdRef.current === newsId || isPlayingNextNewsRef.current) return;
        
        if (currentNews && currentNews.newsId) {
          recordHistory(currentNews.newsId, currentNews.category || "기타", "COMPLETED", currentSentenceIdx);
        }
        
        ttsFailureCountRef.current = 0;
        if (resumeInfoRef.current) {
          setResumeInfo(null);
          resumeInfoRef.current = null;
        }
        
        lastProcessedNewsIdRef.current = newsId;
        playNextNews();
      }
    },
    onPlaybackStart: (newsId) => {
      if (newsId) {
        isPlayingNextNewsRef.current = false;
        lastProcessedNewsIdRef.current = null;
        setStatus("playing");
        setStatusMessage("뉴스를 재생 중입니다...");
        newsStartTimeRef.current = Date.now();
        currentNewsIdRef.current = newsId;
        totalPausedDurationRef.current = 0;
        pausedTimeRef.current = null;
        const news = currentNews || newsQueue.find(n => n.newsId === newsId);
        if (news) recordHistory(newsId, news.category || "기타", "PLAY", 0);
      }
    },
  });

  useEffect(() => {
    playlistsRef.current = playlists;
  }, [playlists]);

  useEffect(() => {
    const initializeDriveMode = async () => {
      try {
        await playFixedMessage("WELCOME");
      } catch (error) {
        console.error("환영 멘트 재생 실패:", error);
      }
      
      const loadPlaylists = async () => {
        setIsLoadingPlaylists(true);
        try {
          const playlists = await driveApi.getPlaylists(userId);
          setPlaylists(playlists);
        } catch (error) {
          console.error("플레이리스트 로드 실패:", error);
          setStatus("error");
          setStatusMessage("플레이리스트를 불러오는 중 오류가 발생했습니다");
        } finally {
          setIsLoadingPlaylists(false);
        }
      };
      loadPlaylists();
    };
    initializeDriveMode();
  }, [userId]);

  const handlePlaylistSelect = async (playlist) => {
    setIsLoadingPlaylist(true);
    try {
      const response = await driveApi.selectPlaylist(userId, playlist.id);
      console.log("[selectPlaylist] 백엔드 응답:", {
        playlistId: response.playlistId,
        playlistTitle: response.playlistTitle,
        message: response.message,
        newsListLength: response.newsList?.length ?? 0,
        historyId: response.historyId,
        audioUrl: response.audioUrl ? "(있음)" : null,
        newsList: response.newsList?.map((n) => ({ title: n.title?.slice(0, 30), category: n.category })) ?? [],
      });

      if (!response.newsList || response.newsList.length === 0) {
        setStatus("error");
        setStatusMessage(response.message || "해당 카테고리의 뉴스가 없습니다.");
        return;
      }
      
      if (response.isDuplicate && response.message) {
        setStatusMessage(response.message);
        await playFixedMessage("NEWS_NOT_UPDATED");
      }
      
      setPlaylistNewsList(response.newsList);
      setSelectedPlaylist({
        ...playlist,
        title: response.playlistTitle,
      });
      setCurrentPlaylistAudioUrl(response.audioUrl);
      setCurrentPlaylistHistoryId(response.historyId);
      setIsHistoryPanelCollapsed(true);
      setShowPlaylistSelection(false);
      setStatusMessage("TTS를 불러오는 중입니다. 1~2분 걸릴 수 있습니다.");
    } catch (error) {
      console.error("플레이리스트 선택 실패:", error);
      setStatus("error");
      setStatusMessage("플레이리스트를 불러오는 중 오류가 발생했습니다");
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  const handleSelectPlaylistByIndex = (index) => {
    if (playlists && playlists.length > index) {
      handlePlaylistSelect(playlists[index]);
    }
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (isRecording) stopRecording().catch(() => {});
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      if (commandRetryTimerRef.current) clearTimeout(commandRetryTimerRef.current);
      if (initRetryTimerRef.current) clearTimeout(initRetryTimerRef.current);
      if (historyLoadTimerRef.current) clearTimeout(historyLoadTimerRef.current);
      if (nextNewsTimerRef.current) clearTimeout(nextNewsTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (textHideTimerRef.current) clearTimeout(textHideTimerRef.current);
      if (playlistSyncTimerRef.current) clearInterval(playlistSyncTimerRef.current);
      fixedMessageSessionRef.current += 1;
      if (fixedMessageAudioRef.current) {
        const prev = fixedMessageAudioRef.current;
        prev.pause();
        try { prev.src = ""; prev.load(); } catch (_) {}
        fixedMessageAudioRef.current = null;
      }
      if (playlistAudioRef.current) {
        playlistAudioRef.current.pause();
        playlistAudioRef.current.src = '';
        playlistAudioRef.current.load();
        playlistAudioRef.current = null;
      }
    };
  }, []);

  // 상태 메시지 업데이트
  useEffect(() => {
    if (isPlaying && !isPaused) {
      setStatus("playing");
      setStatusMessage(currentNewsId ? "뉴스를 재생 중입니다..." : "안내 멘트를 재생 중입니다...");
      if (pausedTimeRef.current) {
        totalPausedDurationRef.current += Date.now() - pausedTimeRef.current;
        pausedTimeRef.current = null;
      }
    } else if (isPaused) {
      setStatus("idle");
      setStatusMessage("일시정지 중입니다. 마이크 버튼을 눌러 명령하세요");
      if (!pausedTimeRef.current) pausedTimeRef.current = Date.now();
    } else {
      if (!showResumeChoice && status !== "error" && status !== "recording" && status !== "processing") {
        setStatus("idle");
        setStatusMessage("마이크 버튼을 눌러 음성 명령을 시작하세요");
      }
    }
  }, [isPlaying, isPaused, currentNewsId, showResumeChoice, status]);

  // 재생/일시정지 핸들러
  const handlePlayPause = () => {
    if (isPlaying || isPaused) {
      togglePause();
    } else {
      if (briefingAudioUrl && !isPlayingBriefing) {
        setIsPlayingBriefing(true);
        setStatusMessage("안내 멘트를 재생합니다...");
        playAudio(briefingAudioUrl, null, 0);
      } else if (resumeInfo && resumeInfo.newsId) {
        (async () => {
          try {
            setStatus("processing");
            setStatusMessage("뉴스를 준비하고 있습니다...");
            // TODO: 플레이리스트 방식에서는 이어듣기 기능 제거됨
            // await playFixedMessage("RESUME_ANNOUNCEMENT");
            const audioUrl = `/api/drive/tts?newsId=${resumeInfo.newsId}&voiceType=nova&speed=1.0&startSentenceIdx=${resumeInfo.lastSentenceIdx || 0}`;
            setResumeInfo(null);
            resumeInfoRef.current = null;
            playAudio(audioUrl, resumeInfo.newsId, resumeInfo.lastSentenceIdx || 0);
          } catch (error) {
            console.error("이어듣기 재생 실패:", error);
            setStatus("error");
            setResumeInfo(null);
            resumeInfoRef.current = null;
            if (newsQueue && newsQueue.length > 0) {
              if (nextNewsTimerRef.current) clearTimeout(nextNewsTimerRef.current);
              nextNewsTimerRef.current = setTimeout(() => playNextNews(), 2000);
            }
          }
        })();
      } else if (newsQueue && newsQueue.length > 0) {
        playNextNews();
      } else {
        setStatusMessage("재생할 뉴스가 없습니다");
      }
    }
  };

  // 드라이브 모드 진입 (동시성 제어 + Retry Policy)
  const enterDriveMode = async () => {
    if (!isMountedRef.current) return;
    if (enterDriveModeInProgressRef.current) return;
    enterDriveModeInProgressRef.current = true;
    try {
      const data = await driveApi.enterDriveMode(userId);
      if (!isMountedRef.current) {
        enterDriveModeInProgressRef.current = false;
        return;
      }
      console.log("[enterDriveMode] 진입 데이터:", data.scenario);
      initRetryCountRef.current = 0;

      const welcomeMessage = "드라이브 모드에 오신 것을 환영합니다";
      const welcomeAudioUrl = `/api/drive/tts/script?text=${encodeURIComponent(welcomeMessage)}&voiceType=nova&speed=1.0`;
      
      if (!isPlayingBriefing && !briefingAudioUrlRef.current) {
        setBriefingAudioUrl(welcomeAudioUrl);
        briefingAudioUrlRef.current = welcomeAudioUrl;
        setIsPlayingBriefing(true);
        isPlayingBriefingRef.current = true;
        setStatus("processing");
        setStatusMessage("드라이브 모드에 오신 것을 환영합니다");
        pendingEntryDataRef.current = data;
        
        if (testNoAudio && simulatePlaybackEnd) {
          setTimeout(() => {
            if (isMountedRef.current) simulatePlaybackEnd();
          }, 1500);
        } else {
          playAudio(welcomeAudioUrl, null, 0);
        }
      }
    } catch (error) {
      console.error("진입 실패:", error);
      if (error.message && error.message.includes("네트워크")) {
        setStatus("processing");
        setStatusMessage("네트워크 연결을 확인 중입니다...");
        const retryCount = initRetryCountRef.current;
        if (retryCount < MAX_INIT_RETRIES) {
          initRetryCountRef.current = retryCount + 1;
          if (initRetryTimerRef.current) clearTimeout(initRetryTimerRef.current);
          initRetryTimerRef.current = setTimeout(async () => {
            enterDriveModeInProgressRef.current = false;
            try {
              await enterDriveMode();
            } catch (retryError) {
              if (initRetryCountRef.current >= MAX_INIT_RETRIES) {
                setStatus("error");
                setStatusMessage("네트워크 연결에 문제가 있습니다.");
                initRetryCountRef.current = 0;
              }
            }
          }, INIT_RETRY_DELAY_MS);
          return;
        }
        initRetryCountRef.current = 0;
      }
      setStatus("error");
      setStatusMessage(error.message?.includes("네트워크") ? "네트워크 연결에 문제가 있습니다." : `연결 오류: ${error.message}`);
    } finally {
      enterDriveModeInProgressRef.current = false;
    }
  };

  // 음성 명령 처리
  const processVoiceCommand = async (audioBlob, filename) => {
    if (!isMountedRef.current) return;
    if (isProcessingCommandRef.current) return;
    processVoiceCommand.lastFilename = filename;

    try {
      const result = await driveApi.analyzeVoiceCommand(audioBlob, userId, filename);
      if (!isMountedRef.current) return;

      if (result.rawText) {
        setRecognizedText(result.rawText);
        if (textHideTimerRef.current) clearTimeout(textHideTimerRef.current);
        textHideTimerRef.current = setTimeout(() => setRecognizedText(null), 3000);
      } else {
        setRecognizedText(null);
      }

      if (result.intent) {
        commandRetryCountRef.current = 0;
        let intent = result.intent;
        if (intent === "PLAY" && result.rawText && currentNewsId && /다음\s*(뉴스|기사|꺼|거)?/i.test(result.rawText)) {
          intent = "NEXT";
        }

        const allowedDuringBriefing = ["NEXT", "STOP", "PAUSE"];
        if (isPlayingBriefing && !allowedDuringBriefing.includes(intent)) return;
        
        setStatus("success");
        const selectIntents = ["SELECT_INTEREST", "SELECT_LATEST", "SELECT_ECONOMY", "SELECT_POLITICS", "SELECT_IT", "SELECT_HOT"];
        const isSelectOnSelectionScreen = showPlaylistSelection && selectIntents.includes(intent);
        if ((demoVoice || useDemoFallback) && selectIntents.includes(intent)) {
          setStatusMessage("재생을 시작합니다");
        } else {
          setStatusMessage(`명령 실행: ${intent}`);
        }

        // 선택 화면에서 플레이리스트 선택 시: 인식 텍스트를 먼저 보여준 뒤, 잠시 후 재생 화면으로 이동 (ref로 최신 playlists 사용)
        if (isSelectOnSelectionScreen) {
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
          statusTimerRef.current = setTimeout(() => {
            if (!isMountedRef.current) return;
            const list = playlistsRef.current;
            const selectIntentToIndex = { SELECT_INTEREST: 0, SELECT_LATEST: 1, SELECT_ECONOMY: 2, SELECT_POLITICS: 3, SELECT_IT: 4, SELECT_HOT: 5 };
            const index = selectIntentToIndex[intent];
            if (list && list.length > index && list[index]) {
              handlePlaylistSelect(list[index]);
            } else {
              setStatusMessage("플레이리스트를 선택해주세요");
            }
            if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
            statusTimerRef.current = setTimeout(() => {
              setStatus(prev => prev === "success" ? "idle" : prev);
              if (status === "success") setStatusMessage("");
            }, 2000);
          }, SELECT_CONFIRM_DELAY_MS);
        } else {
          handleCommand(intent);
          if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
          statusTimerRef.current = setTimeout(() => {
            setStatus(prev => prev === "success" ? "idle" : prev);
            if (status === "success") setStatusMessage("");
          }, 2000);
        }
      } else {
        const isSttFailure = result.message && (result.message.includes("음성을 인식하지 못했습니다") || result.message.includes("인식하지 못했습니다"));
        
        if (isSttFailure) {
          setStatusMessage(result.message || "음성을 인식하지 못했습니다. 더 명확하게 말씀해주세요.");
          handleCommand("STT_FAILED");
        } else {
          setStatusMessage(result.message || "명령을 이해하지 못했습니다.");
          handleCommand("UNKNOWN");
        }
        
        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        statusTimerRef.current = setTimeout(() => {
          setStatus("idle");
          setRecognizedText(null);
        }, 3000);
      }
    } catch (error) {
      setStatus("error");
      setRecognizedText(null);
      
      if (error.message && error.message.includes("네트워크")) {
        setStatusMessage("네트워크 연결을 확인 중입니다...");
        const retryCount = commandRetryCountRef.current;
        if (retryCount < MAX_COMMAND_RETRIES) {
          commandRetryCountRef.current = retryCount + 1;
          const retryFilename = processVoiceCommand.lastFilename;
          
          if (commandRetryTimerRef.current) clearTimeout(commandRetryTimerRef.current);
          commandRetryTimerRef.current = setTimeout(async () => {
            try {
              await processVoiceCommand(audioBlob, retryFilename);
            } catch {
              if (commandRetryCountRef.current >= MAX_COMMAND_RETRIES) {
                setStatus("error");
                setStatusMessage("네트워크 연결 오류");
                commandRetryCountRef.current = 0;
              }
            }
          }, COMMAND_RETRY_DELAY_MS);
        } else {
          setStatus("error");
          setStatusMessage("네트워크 연결 오류");
          commandRetryCountRef.current = 0;
        }
      } else {
        setStatus("idle");
        setStatusMessage("음성 명령을 기다리는 중입니다...");
      }
    } finally {
      isProcessingCommandRef.current = false;
    }
  };

  // 히스토리 기록
  const recordHistory = async (newsId, category, status, lastSentenceIdx = null) => {
    try {
      let listenDuration = 0;
      if (newsStartTimeRef.current && currentNewsIdRef.current === newsId) {
        const totalTime = Date.now() - newsStartTimeRef.current;
        if (pausedTimeRef.current) {
          totalPausedDurationRef.current += Date.now() - pausedTimeRef.current;
          pausedTimeRef.current = null;
        }
        listenDuration = Math.max(0, Math.floor((totalTime - totalPausedDurationRef.current) / 1000));
        
        newsStartTimeRef.current = null;
        currentNewsIdRef.current = null;
        totalPausedDurationRef.current = 0;
        pausedTimeRef.current = null;
      }
      const sentenceIdx = lastSentenceIdx !== null ? lastSentenceIdx : (currentSentenceIdx || 0);
      await driveApi.recordHistory(userId, newsId, category, status, listenDuration, false, sentenceIdx);
    } catch (error) {
      console.error("히스토리 기록 실패:", error);
    }
  };

  /** 고정 멘트용 오디오 정리 (메모리 누수 방지) */
  const cleanupFixedMessageAudio = useCallback(() => {
    const prev = fixedMessageAudioRef.current;
    if (!prev) return;
    prev.pause();
    prev.removeEventListener("canplaythrough", prev._onCanPlay);
    prev.removeEventListener("ended", prev._onEnded);
    prev.removeEventListener("error", prev._onError);
    prev.src = "";
    prev.load();
    fixedMessageAudioRef.current = null;
  }, []);

  const playFixedMessage = async (intent) => {
    const fixedMessageKeys = {
      WELCOME: "welcome",
      NEXT: "next_article",
      PAUSE: "paused",
      RESUME: "resumed",
      UNKNOWN: "command_not_understood",
      STT_FAILED: "stt_failed",
      HELP: "help",
      PLAYLIST_LOADING: "playlist_loading",
      PLAYLIST_COMPLETED: "playlist_completed",
      TTS_ERROR: "tts_error",
      NETWORK_ERROR: "network_error",
      TTS_RETRY: "tts_retry",
      NEWS_NOT_UPDATED: "news_not_updated",
      PLAYLIST_DELETED: "playlist_deleted",
    };
    const fixedMessages = {
      WELCOME: "드라이브 모드에 오신 것을 환영합니다",
      NEXT: "다음 기사를 읽어드릴게요",
      PAUSE: "일시정지되었습니다",
      RESUME: "재생을 계속합니다",
      UNKNOWN: "명령을 이해하지 못했습니다. '다음', '일시정지' 같은 명령어를 말씀해주세요.",
      STT_FAILED: "음성을 인식하지 못했습니다. 더 크고 명확하게 말씀해주세요.",
      HELP: "마이크 버튼을 누르고 명령을 말해 주세요.",
      PLAYLIST_LOADING: "플레이리스트를 준비하고 있습니다",
      PLAYLIST_COMPLETED: "플레이리스트 재생을 완료했습니다",
      TTS_ERROR: "음성 생성 중 오류가 발생했습니다",
      NETWORK_ERROR: "연결 문제가 있습니다. 잠시 후 다시 시도해주세요.",
      TTS_RETRY: "뉴스 재생에 문제가 발생했습니다. 잠시 후 다시 시도합니다.",
      NEWS_NOT_UPDATED: "뉴스가 아직 업데이트되지 않았습니다. 이전 플레이리스트를 재생합니다.",
      PLAYLIST_DELETED: "플레이리스트가 삭제되어 재생이 중단되었습니다.",
    };

    const fixedKey = fixedMessageKeys[intent];
    const message = fixedMessages[intent];
    if (!fixedKey || !message) return Promise.resolve();

    const session = ++fixedMessageSessionRef.current;
    // 재생 화면에서 고정 멘트 재생 시 플레이리스트 잠시 정지 (TTS가 들리도록)
    let wasPlayingPlaylist = false;
    if (selectedPlaylist && !showPlaylistSelection && playlistAudioRef.current && isPlaybackPlaying) {
      playlistAudioRef.current.pause();
      setIsPlaybackPlaying(false);
      wasPlayingPlaylist = true;
    }

    try {
      if (isPlaying && !isPaused) togglePause();
      cleanupFixedMessageAudio();
      
      const voiceType = "nova";
      const speed = 1.0;
      const speedStr = "1.0";
      const staticAudioUrl = `/static/audio/fixed/${fixedKey}_${voiceType}_${speedStr}.mp3`;
      const apiFallbackUrl = `/api/drive/tts/script?text=${encodeURIComponent(message)}&voiceType=${voiceType}&speed=${speedStr}`;

      const playOnce = (url) => new Promise((resolve) => {
        if (session !== fixedMessageSessionRef.current) {
          resolve({ ok: false, stale: true });
          return;
        }
        const audio = new Audio(url);
        fixedMessageAudioRef.current = audio;
        audio.preload = "auto";
        let finished = false;
        const done = (ok) => {
          if (finished) return;
          finished = true;
          if (fixedMessageAudioRef.current === audio) fixedMessageAudioRef.current = null;
          resolve({ ok });
        };
        const onCanPlay = () => {
          if (finished || session !== fixedMessageSessionRef.current) return;
          audio.play().then(() => {
            if (finished || session !== fixedMessageSessionRef.current) return;
          }).catch((err) => {
            if (finished) return;
            if (err?.name === "NotAllowedError") {
              setStatusMessage("재생을 위해 화면을 한 번 클릭해주세요.");
            }
            done(false);
          });
        };
        const onEnded = () => done(true);
        const onError = () => done(false);
        audio.addEventListener("canplaythrough", onCanPlay);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("error", onError);
        audio.load();
      });

      if (session !== fixedMessageSessionRef.current) return;
      const first = await playOnce(staticAudioUrl);
      if (first?.ok || first?.stale) return;
      if (session !== fixedMessageSessionRef.current) return;
      await playOnce(apiFallbackUrl);
    } catch (error) {
      console.error("고정 멘트 재생 실패:", error);
    } finally {
      if (session === fixedMessageSessionRef.current) {
        cleanupFixedMessageAudio();
        // HELP/UNKNOWN/STT_FAILED는 재생 상태를 바꾸지 않으므로, 고정 멘트 후 플레이리스트 재개
        const resumeAfterMessage = ["HELP", "UNKNOWN", "STT_FAILED"];
        if (wasPlayingPlaylist && resumeAfterMessage.includes(intent) && selectedPlaylist && !showPlaylistSelection && playlistAudioRef.current) {
          playlistAudioRef.current.play().catch((err) => {
            if (err?.name === "AbortError") return;
            console.error("고정 멘트 후 재생 재개 실패:", err);
          });
          setIsPlaybackPlaying(true);
        }
      }
    }
  };

  const handleCommand = (intent) => {
    if (showPlaylistSelection) {
      switch (intent) {
        case "SELECT_INTEREST":
          if (playlists.length > 0) handlePlaylistSelect(playlists[0]);
          break;
        case "SELECT_LATEST":
          if (playlists.length > 1) handlePlaylistSelect(playlists[1]);
          break;
        case "SELECT_ECONOMY":
          if (playlists.length > 2) handlePlaylistSelect(playlists[2]);
          break;
        case "SELECT_POLITICS":
          if (playlists.length > 3) handlePlaylistSelect(playlists[3]);
          break;
        case "SELECT_IT":
          if (playlists.length > 4) handlePlaylistSelect(playlists[4]);
          break;
        case "SELECT_HOT":
          if (playlists.length > 5) handlePlaylistSelect(playlists[5]);
          break;
        default:
          setStatusMessage("플레이리스트를 선택해주세요");
      }
      return;
    }
    
    switch (intent) {
      case "NEXT":
        setStatusMessage("플레이리스트는 하나의 연속된 재생입니다. 재생바를 사용하여 이동하세요.");
        break;
      case "PAUSE":
        // 재생 화면(플레이리스트)에서는 playlistAudioRef 제어, 그 외에는 useDriveAudio togglePause
        if (selectedPlaylist && !showPlaylistSelection && playlistAudioRef.current) {
          if (isPlaybackPlaying) {
            playlistAudioRef.current.pause();
            setIsPlaybackPlaying(false);
          }
        } else {
          togglePause();
        }
        playFixedMessage("PAUSE");
        break;
      case "RESUME":
        if (selectedPlaylist && !showPlaylistSelection && playlistAudioRef.current) {
          if (!isPlaybackPlaying) {
            playlistAudioRef.current.play().catch((error) => {
              if (error?.name === "AbortError") return;
              console.error("오디오 재생 실패:", error);
            });
            setIsPlaybackPlaying(true);
          }
        } else {
          togglePause();
        }
        playFixedMessage("RESUME");
        break;
      case "STOP":
        if (currentNews && currentNews.newsId) {
          recordHistory(currentNews.newsId, currentNews.category || "기타", "REJECTED", currentSentenceIdx);
        }
        stopDriveMode();
        break;
      case "SEEK_FORWARD":
        if (selectedPlaylist && !showPlaylistSelection && playlistAudioRef.current && playbackDuration > 0) {
          const nextTime = Math.min(playbackCurrentTime + 10, playbackDuration);
          handlePlaybackSeek(nextTime);
          setStatusMessage("10초 앞으로 이동");
        } else {
          setStatusMessage("재생 중에만 이동할 수 있습니다.");
        }
        break;
      case "SEEK_BACKWARD":
        if (selectedPlaylist && !showPlaylistSelection && playlistAudioRef.current && playbackDuration > 0) {
          const prevTime = Math.max(playbackCurrentTime - 10, 0);
          handlePlaybackSeek(prevTime);
          setStatusMessage("10초 뒤로 이동");
        } else {
          setStatusMessage("재생 중에만 이동할 수 있습니다.");
        }
        break;
      case "UNKNOWN": playFixedMessage("UNKNOWN"); break;
      case "STT_FAILED": playFixedMessage("STT_FAILED"); break;
      case "RESUME_CHOICE": if (resumeInfo && resumeInfo.newsId) handleResumeChoice("resume"); break;
      case "NEW_BRIEFING_CHOICE": handleResumeChoice("new"); break;
      case "HISTORY_OPEN": loadHistory(); break;
      case "HISTORY_PLAY":
        if (history.length > 0) playHistoryNews(history[0].newsId, history[0].lastSentenceIdx);
        break;
      case "HISTORY_DELETE":
        if (history.length > 0) deleteHistory(history[0].historyId);
        break;
      case "HELP": playFixedMessage("HELP"); break;
      default: setStatusMessage(`명령 실행: ${intent}`);
    }
  };

  // 다음 뉴스 재생
  const playNextNews = async () => {
    if (!isMountedRef.current) return;
    if (isPlayingNextNewsRef.current) return;
    
    isPlayingNextNewsRef.current = true;
    try {
      const currentQueue = newsQueueRef.current || [];
      if (currentQueue.length === 0) {
        isPlayingNextNewsRef.current = false;
        setStatusMessage("모든 뉴스를 재생했습니다");
        setStatus("idle");
        playFixedMessage("PLAYLIST_COMPLETED");
        return;
      }
      
      const nextNews = currentQueue[0];
      const newQueue = currentQueue.slice(1);
      newsQueueRef.current = newQueue;
      setNewsQueue(newQueue);
      
      const newsWithTitle = { ...nextNews, title: nextNews.title || `뉴스 ${nextNews.newsId}` };
      setCurrentNews(newsWithTitle);
      setStatus("processing");
      setStatusMessage("뉴스를 준비하고 있습니다...");

      const audioUrl = `/api/drive/tts?newsId=${nextNews.newsId}&voiceType=nova&speed=1.0`;
      ttsFailureCountRef.current = 0;
      
      if (testNoAudio) {
        setTimeout(() => onPlaybackError?.(nextNews.newsId, { errorCode: 4, testMode: true }), 100);
      } else {
        playAudio(audioUrl, nextNews.newsId, 0);
      }
    } catch (error) {
      console.error("다음 뉴스 재생 오류:", error);
      setStatus("error");
      isPlayingNextNewsRef.current = false;
    }
  };

  // 드라이브 모드 종료
  const stopDriveMode = async () => {
    try {
      // 모든 오디오 정지
      stopAudio();
      
      // 플레이리스트 오디오 정지
      if (playlistAudioRef.current) {
        playlistAudioRef.current.pause();
        playlistAudioRef.current.src = '';
        playlistAudioRef.current.load();
        playlistAudioRef.current = null;
      }
      setIsPlaybackPlaying(false);
      if (playlistSyncTimerRef.current) {
        clearInterval(playlistSyncTimerRef.current);
        playlistSyncTimerRef.current = null;
      }
      
      // 고정 멘트 오디오 정리
      fixedMessageSessionRef.current += 1;
      cleanupFixedMessageAudio();
      
      // 녹음 정지
      if (demoVoice && demoRecording) setDemoRecording(false);
      if (useDemoFallback) setUseDemoFallback(false);
      if (isRecording) stopRecording().catch(() => {});
      
      // 재생 상태 초기화 (playback_state 삭제)
      if (selectedPlaylist) {
        try {
          await driveApi.syncPlaybackState(userId, "", 0);
        } catch (error) {
          console.error("재생 상태 초기화 실패:", error);
        }
      }
      
      // 드라이브 모드 비활성화
      await driveApi.setDriveModeActive(userId, false);
      
      // 상태 초기화
      setStatus("idle");
      setStatusMessage("드라이브 모드를 종료했습니다");
      setSelectedPlaylist(null);
      setPlaylistNewsList([]);
      setShowPlaylistSelection(true);
      setCurrentPlaylistAudioUrl(null);
      setCurrentPlaylistHistoryId(null);
      setIsPlaybackPlaying(false);
      setPlaybackCurrentTime(0);
      setPlaybackDuration(0);
      
      if (onClose) onClose();
    } catch (error) {
      console.error("종료 실패:", error);
    }
  };

  // 데모/폴백: 마이크 뗄 때는 실행하지 않음. (번호키 누른 뒤 마이크를 다시 누를 때 실행)
  // 첫 번째 마이크 누른 뒤 ~ 두 번째 마이크 누를 때까지 파장 유지를 위해 demoRecording은 유지
  const handleDemoMicUp = async () => {
    if (!demoRecording) return;
    setStatusMessage("");
  };

  // 마이크 버튼 클릭 핸들러 (데모/폴백: 1회 누름 → 번호키 → 마이크 다시 누름 시 명령 실행)
  const handleMicrophoneButtonClick = async () => {
    const useDemoFlow = demoVoice || useDemoFallback;
    if (useDemoFlow) {
      // 번호키를 이미 누른 뒤 마이크를 다시 누른 경우 → 데모 MP3로 processVoiceCommand 호출 (두 번째 클릭이 여기서 처리됨)
      if (demoKeyPressedThisSessionRef.current) {
        setDemoRecording(false);
        const entries = showPlaylistSelection ? DEMO_MP3_ENTRIES_SELECTION : DEMO_MP3_ENTRIES_PLAYBACK;
        const entry = entries.find((e) => e.key === demoCommandKey);
        demoKeyPressedThisSessionRef.current = false;
        if (!entry) {
          setStatus("idle");
          return;
        }
        setStatus("processing");
        setStatusMessage("음성을 인식하고 있습니다...");
        try {
          const url = getDemoMp3Url(entry.file);
          const res = await fetch(url);
          const blob = await res.blob();
          await processVoiceCommand(blob, entry.file);
        } catch (error) {
          setStatus("error");
          setTimeout(() => { setStatus("idle"); setStatusMessage(""); }, 3000);
        }
        return;
      }
      // 이미 파장 중인데 번호키 없이 마이크만 다시 누른 경우 → 무시
      if (demoRecording) return;
      // 첫 번째 마이크 누름: 번호키 입력 대기
      setStatus("recording");
      setStatusMessage("");
      setRecognizedText(null);
      setDemoRecording(true);
      if (isPlaying && !isPaused && currentNewsId) setVolume(0.2);
      return;
    }

    if (!isRecording) {
      setStatus("recording");
      setStatusMessage("말씀해주세요... (말이 멈추면 자동 종료)");
      setRecognizedText(null);
      try {
        await startRecording();
      } catch (error) {
        const message = String(error?.message || "");
        const isNoMic =
          message.includes("마이크 찾을 수 없음") ||
          message.includes("마이크를 찾을 수 없습니다") ||
          message.toLowerCase().includes("no microphone");

        if (isNoMic) {
          console.warn("[Push-to-Talk] 마이크 없음. 데모 모드로 전환합니다.");
          setUseDemoFallback(true);
          setStatus("recording");
          setStatusMessage("말씀해주세요...");
          setRecognizedText(null);
          setDemoRecording(true);
          if (isPlaying && !isPaused && currentNewsId) setVolume(0.2);
          return;
        }

        console.warn("[Push-to-Talk] 녹음 시작 실패:", error);
        setStatus("error");
        setStatusMessage("마이크를 찾을 수 없습니다. 연결을 확인해주세요.");
        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        statusTimerRef.current = setTimeout(() => {
          setStatus("idle");
          setStatusMessage("");
        }, 3000);
      }
    } else {
      await handleMicrophoneButtonUp();
    }
  };

  // 마이크 버튼 떼기 핸들러
  const handleMicrophoneButtonUp = async () => {
    if (demoVoice || useDemoFallback) {
      await handleDemoMicUp();
      return;
    }
    if (isRecording) {
      const now = Date.now();
      if (now - lastCommandTimeRef.current < refs.COMMAND_COOLDOWN) {
        await stopRecording().catch(() => {});
        setStatus("idle");
        return;
      }
      
      if (isProcessingCommandRef.current) {
        await stopRecording().catch(() => {});
        return;
      }
      
      setStatus("processing");
      setStatusMessage("음성을 인식하고 있습니다...");
      
      try {
        const audioBlob = await stopRecording();
        if (!audioBlob) {
          setStatus("idle");
          return;
        }
        
        // 오디오 품질 검증
        if (audioBlob.size < 2000) {
          setStatus("error");
          setStatusMessage("조금 더 길게 말씀해주세요");
          setTimeout(() => { setStatus("idle"); setStatusMessage(""); }, 2000);
          return;
        }
        
        isProcessingCommandRef.current = true;
        lastCommandTimeRef.current = now;
        await processVoiceCommand(audioBlob);
        isProcessingCommandRef.current = false;
      } catch (error) {
        isProcessingCommandRef.current = false;
        setStatus("error");
        setTimeout(() => { setStatus("idle"); setStatusMessage(""); }, 2000);
      }
      
      if (isPlaying && !isPaused && currentNewsId) {
        setTimeout(() => setVolume(1.0), 100);
      }
    }
  };

  // 히스토리 관련 핸들러들
  const openHistoryPanel = () => {
    // 재생 중이면 일시정지
    if (playlistAudioRef.current && isPlaybackPlaying) {
      playlistAudioRef.current.pause();
      setIsPlaybackPlaying(false);
    }
    if (playlistSyncTimerRef.current) {
      clearInterval(playlistSyncTimerRef.current);
      playlistSyncTimerRef.current = null;
    }
    setIsHistoryPanelCollapsed(false);
    loadHistory();
  };

  /** 히스토리 버튼 클릭 시 패널 열기/닫기 토글 */
  const toggleHistoryPanel = () => {
    if (isHistoryPanelCollapsed) {
      openHistoryPanel();
    } else {
      setIsHistoryPanelCollapsed(true);
    }
  };
  const loadHistory = async () => {
    try {
      const data = await driveApi.getHistory(userId);
      const list = Array.isArray(data) ? data : (data?.content ?? data?.data ?? []);
      setHistory(Array.isArray(list) ? list : []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const deleteHistory = async (historyId) => {
    // 현재 재생 중인 플레이리스트인지 확인
    const isCurrentPlaylist = currentPlaylistHistoryId === historyId;
    const wasPlaying = isCurrentPlaylist && isPlaybackPlaying;
    
    try {
      // 현재 재생 중인 플레이리스트면 먼저 중단
      if (isCurrentPlaylist) {
        if (playlistAudioRef.current) {
          playlistAudioRef.current.pause();
          playlistAudioRef.current.currentTime = 0;
          playlistAudioRef.current = null;
        }
        setIsPlaybackPlaying(false);
        
        if (playlistSyncTimerRef.current) {
          clearInterval(playlistSyncTimerRef.current);
          playlistSyncTimerRef.current = null;
        }
      }
      
      // 히스토리 삭제
      await driveApi.deleteHistory(historyId);
      await loadHistory();
      
      // 현재 재생 중인 플레이리스트를 삭제했으면 선택 화면으로 복귀
      if (isCurrentPlaylist) {
        setSelectedPlaylist(null);
        setPlaylistNewsList([]);
        setCurrentPlaylistAudioUrl(null);
        setCurrentPlaylistHistoryId(null);
        setShowPlaylistSelection(true);
        setIsHistoryPanelCollapsed(true);
        setPlaybackCurrentTime(0);
        setPlaybackDuration(0);
        
        // 재생 중이었으면 고정 멘트 재생
        if (wasPlaying) {
          setStatusMessage("플레이리스트가 삭제되어 재생이 중단되었습니다.");
          playFixedMessage("PLAYLIST_DELETED").catch(() => {});
        }
      }
      // 다른 플레이리스트 삭제 시는 히스토리 목록만 갱신 (재생 계속)
    } catch (error) {
      alert("히스토리 삭제 실패");
      
      // 삭제 실패 시 재생 중이었으면 재생 재개 (선택사항)
      if (wasPlaying && playlistAudioRef.current) {
        playlistAudioRef.current.play().catch(() => {});
        setIsPlaybackPlaying(true);
      }
    }
  };
  const playHistoryNews = (newsId, lastSentenceIdx) => {
    if (!newsId) return;
    const item = history.find((h) => h.newsId === newsId);
    const title = item?.title || item?.newsTitle || `뉴스 ${newsId}`;
    setCurrentNews({ newsId, title, category: item?.category || "기타" });
    setStatus("processing");
    setStatusMessage("뉴스를 준비하고 있습니다...");
    const audioUrl = `/api/drive/tts?newsId=${newsId}&voiceType=nova&speed=1.0&startSentenceIdx=${lastSentenceIdx ?? 0}`;
    playAudio(audioUrl, newsId, lastSentenceIdx ?? 0);
  };
  const handleResumeChoice = async (choice) => {
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    setShowResumeChoice(false);
    showResumeChoiceRef.current = false;
    setRecognizedText(null);
    const toResume = resumeInfo?.newsId ? resumeInfo : resumeInfoRef.current;

    if (choice === "resume") {
      if (toResume && toResume.newsId) {
        try {
          setStatus("processing");
          setStatusMessage("뉴스를 준비하고 있습니다...");
          await playFixedMessage("RESUME_ANNOUNCEMENT");
          const audioUrl = `/api/drive/tts?newsId=${toResume.newsId}&voiceType=nova&speed=1.0&startSentenceIdx=${toResume.lastSentenceIdx || 0}`;
          setResumeInfo(null);
          resumeInfoRef.current = null;
          playAudio(audioUrl, toResume.newsId, toResume.lastSentenceIdx || 0);
          if (isRecording) stopRecording().catch(() => {});
        } catch {
          setResumeInfo(null);
          resumeInfoRef.current = null;
          setStatus("error");
        }
      }
    } else if (choice === "new") {
      try {
        setStatus("processing");
        setStatusMessage("새로운 뉴스 브리핑을 준비하고 있습니다...");
        setResumeInfo(null);
        resumeInfoRef.current = null;
        setCurrentNews(null);
        await driveApi.setDriveModeActive(userId, false);
        await new Promise(r => setTimeout(r, 100));
        const entryData = await driveApi.enterDriveMode(userId);
        
        // 강제 NEW_BRIEFING 처리 로직 포함
        let finalQueue = entryData.newsQueue;
        let finalBriefingUrl = entryData.briefingAudioUrl;
        
        if (entryData.scenario === "RESUME_BRIEFING") {
           const q = await driveApi.getNewsQueue(userId);
           finalQueue = { personalNews: q.personalNews, hotNews: q.hotNews };
           finalBriefingUrl = `/api/drive/tts/script?text=${encodeURIComponent("새로운 뉴스 브리핑을 시작합니다")}&voiceType=nova&speed=1.0`;
        }
        
        if (finalQueue) {
          setNewsQueue(finalQueue.personalNews.concat([finalQueue.hotNews]));
        }
        if (finalBriefingUrl) {
          setBriefingAudioUrl(finalBriefingUrl);
          setIsPlayingBriefing(true);
          playAudio(finalBriefingUrl, null, 0);
        } else {
          if (finalQueue && finalQueue.personalNews.length > 0) setTimeout(() => playNextNews(), 200);
        }
      } catch {
        setStatus("error");
      }
    }
  };

  // 히스토리 패널 렌더링 헬퍼
  const groupHistoryByTime = (list) => {
    if (!list || list.length === 0) return { today: [], yesterday: [], others: [] };
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const groups = { today: [], yesterday: [], others: [] };
    list.forEach((item) => {
      if (!item.createdAt) { groups.others.push(item); return; }
      const d = new Date(item.createdAt); d.setHours(0,0,0,0);
      if (d.getTime() === today.getTime()) groups.today.push(item);
      else if (d.getTime() === yesterday.getTime()) groups.yesterday.push(item);
      else groups.others.push(item);
    });
    return groups;
  };

  const renderHistoryPanelContent = () => {
    const list = Array.isArray(history) ? history : [];
    if (list.length === 0) return <div style={{ color: "#64748B", fontSize: "14px", textAlign: "center", padding: "24px" }}>기록이 없습니다.</div>;
    const grouped = groupHistoryByTime(list);
    const sections = [
      { key: "today", label: "오늘", items: grouped.today },
      { key: "yesterday", label: "어제", items: grouped.yesterday },
      { key: "others", label: "이전 기록", items: grouped.others },
    ].filter((s) => s.items.length > 0);

    return sections.map((section) => (
      <div key={section.key} style={{ width: "100%" }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#94A3B8", marginBottom: "12px", textTransform: "uppercase" }}>{section.label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {section.items.map((item) => (
            <div key={item.historyId ?? Math.random()} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748B", fontWeight: "600" }}>{item.category}</span>
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: "600", color: "#F1F5F9" }}>{item?.title ?? item?.newsTitle ?? "제목 없음"}</div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
                    {(item?.createdAt ?? item?.created_at) ? `${new Date(item.createdAt ?? item.created_at).toLocaleDateString("ko-KR")} ${new Date(item.createdAt ?? item.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => playHistoryNews(item.newsId, item.lastSentenceIdx)} style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.2)", color: "#60A5FA", border: "1px solid rgba(59, 130, 246, 0.4)", cursor: "pointer" }}><PlayIcon size={36} /></button>
                  <button onClick={() => item.historyId && deleteHistory(item.historyId)} style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)", cursor: "pointer" }}><TrashIcon size={20} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const drivePageStyles = {
    page: {
      position: "relative",
      height: "100vh",
      overflow: "hidden",
      background: "#010713",
      color: "#F8FAFC",
      padding: "24px",
      boxSizing: "border-box",
    },
    backgroundLayer: { position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" },
    gradient: {
      position: "absolute",
      inset: "-20%",
      background:
        "radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.32), transparent 35%), radial-gradient(circle at 80% 0%, rgba(16, 185, 129, 0.25), transparent 40%)",
      filter: "blur(40px)",
      animation: "backgroundPulse 18s ease-in-out infinite",
    },
    smoke: {
      position: "absolute",
      inset: "-10%",
      background: "linear-gradient(120deg, rgba(15, 23, 42, 0.6), rgba(2, 6, 23, 0.85))",
      opacity: 0.8,
      animation: "smokeDrift 35s linear infinite",
      transform: "scale(1.3)",
    },
    content: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      flexDirection: "row",
      gap: "24px",
      height: "calc(100vh - 48px)",
      minHeight: 0,
      alignItems: "stretch",
    },
    hudWrapper: {
      flex: "3 1 0",
      minWidth: 0,
      background: "rgba(15, 23, 42, 0.75)",
      borderRadius: "32px",
      padding: "32px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 40px 120px rgba(2, 6, 23, 0.65)",
      backdropFilter: "blur(32px)",
      minHeight: 0,
      overflow: "auto",
    },
    historyPanel: {
      flex: "2 1 320px",
      minWidth: "320px",
      maxWidth: "520px",
      background: "rgba(15, 23, 42, 0.6)",
      borderRadius: "28px",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      backdropFilter: "blur(28px)",
    },
    historyHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "24px 24px 12px",
      flexShrink: 0,
    },
    historyListWrap: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "12px 24px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
  };

  // 플레이리스트 재생 화면 상태
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isPlaybackPlaying, setIsPlaybackPlaying] = useState(false);
  const playlistAudioRef = useRef(null);
  const playlistSyncTimerRef = useRef(null);

  // 플레이리스트 오디오 초기화 및 재생 제어
  useEffect(() => {
    if (!currentPlaylistAudioUrl || !selectedPlaylist) {
      if (playlistAudioRef.current) {
        playlistAudioRef.current.pause();
        playlistAudioRef.current = null;
      }
      if (playlistSyncTimerRef.current) {
        clearInterval(playlistSyncTimerRef.current);
        playlistSyncTimerRef.current = null;
      }
      return;
    }

    const audio = new Audio(currentPlaylistAudioUrl);
    playlistAudioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setPlaybackDuration(audio.duration);
      // TTS 로드 완료 시 자동 재생 (완료 시점을 사용자에게 알림)
      if (playlistAudioRef.current !== audio) return;
      setIsPlaybackPlaying(true);
      audio.play().catch((err) => {
        if (err?.name === "NotAllowedError") setStatusMessage("재생을 위해 화면을 한 번 클릭해주세요.");
        setIsPlaybackPlaying(false);
      });
    });

    audio.addEventListener('timeupdate', () => {
      setPlaybackCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', async () => {
      setIsPlaybackPlaying(false);
      
      // 재생 완료 시 히스토리 업데이트
      if (currentPlaylistHistoryId && selectedPlaylist) {
        try {
          const finalTime = Math.floor(playbackDuration);
          const listenDuration = Math.floor(playbackDuration);
          await driveApi.updatePlaylistHistory(
            currentPlaylistHistoryId,
            'COMPLETED',
            finalTime,
            listenDuration
          );
        } catch (error) {
          console.error("히스토리 업데이트 실패:", error);
        }
      }
      
      // 완료 메시지 표시
      setStatus("idle");
      setStatusMessage("플레이리스트 재생을 완료했습니다.");
      playFixedMessage("PLAYLIST_COMPLETED");
      
      setPlaybackCurrentTime(0);
      if (playlistSyncTimerRef.current) {
        clearInterval(playlistSyncTimerRef.current);
        playlistSyncTimerRef.current = null;
      }
    });

    audio.addEventListener('error', (e) => {
      // 이미 교체된(클린업된) 오디오의 error 이벤트는 무시 (play() 중단 등)
      if (e.target !== playlistAudioRef.current) return;
      if (e.target?.error?.code === 1) return; // MEDIA_ERR_ABORTED
      console.error("플레이리스트 오디오 재생 오류:", e);
      setIsPlaybackPlaying(false);
    });

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio.load();
      }
      if (playlistAudioRef.current === audio) {
        playlistAudioRef.current = null;
      }
      if (playlistSyncTimerRef.current) {
        clearInterval(playlistSyncTimerRef.current);
      }
    };
  }, [currentPlaylistAudioUrl, selectedPlaylist]);

  // TTS 로딩 안내 메시지: 오디오가 로드되면 제거
  useEffect(() => {
    if (!selectedPlaylist || showPlaylistSelection) return;
    if (playbackDuration > 0 && statusMessage && statusMessage.includes("TTS를 불러오는 중")) {
      setStatusMessage("");
    }
  }, [selectedPlaylist, showPlaylistSelection, playbackDuration, statusMessage]);

  // 재생 상태 동기화 (5초 주기)
  useEffect(() => {
    if (isPlaybackPlaying && selectedPlaylist && currentPlaylistHistoryId) {
      playlistSyncTimerRef.current = setInterval(() => {
        if (playlistAudioRef.current && selectedPlaylist) {
          const currentTime = Math.floor(playlistAudioRef.current.currentTime);
          driveApi.syncPlaybackState(userId, selectedPlaylist.id, currentTime).catch(() => {});
        }
      }, 5000);
    } else {
      if (playlistSyncTimerRef.current) {
        clearInterval(playlistSyncTimerRef.current);
        playlistSyncTimerRef.current = null;
      }
    }
    return () => {
      if (playlistSyncTimerRef.current) {
        clearInterval(playlistSyncTimerRef.current);
      }
    };
  }, [isPlaybackPlaying, selectedPlaylist, currentPlaylistHistoryId, userId]);

  // 플레이리스트 재생 화면 핸들러
  const handlePlaybackPlayPause = () => {
    if (playlistAudioRef.current) {
      if (isPlaybackPlaying) {
        playlistAudioRef.current.pause();
      } else {
        playlistAudioRef.current.play().catch((error) => {
          if (error?.name === 'AbortError') return;
          console.error("오디오 재생 실패:", error);
        });
      }
      setIsPlaybackPlaying(!isPlaybackPlaying);
    }
  };

  const handlePlaybackSeek = (newTime) => {
    if (playlistAudioRef.current) {
      playlistAudioRef.current.currentTime = newTime;
      setPlaybackCurrentTime(newTime);
      
      // 재생바 조작 시 즉시 동기화
      if (selectedPlaylist && currentPlaylistHistoryId) {
        const currentTime = Math.floor(newTime);
        driveApi.syncPlaybackState(userId, selectedPlaylist.id, currentTime).catch(() => {});
      }
    }
  };

  const handleBackToSelection = () => {
    // 재생 일시정지
    if (playlistAudioRef.current) {
      playlistAudioRef.current.pause();
      playlistAudioRef.current.currentTime = 0;
      setIsPlaybackPlaying(false);
    }
    if (playlistSyncTimerRef.current) {
      clearInterval(playlistSyncTimerRef.current);
      playlistSyncTimerRef.current = null;
    }
    
    // 재생 상태 서버에 저장 (선택사항)
    if (currentPlaylistHistoryId && selectedPlaylist) {
      const currentTime = playlistAudioRef.current 
        ? Math.floor(playlistAudioRef.current.currentTime) 
        : 0;
      driveApi.syncPlaybackState(userId, selectedPlaylist.id, currentTime).catch(() => {});
    }
    
    setSelectedPlaylist(null);
    setPlaylistNewsList([]);
    setShowPlaylistSelection(true);
    setCurrentPlaylistAudioUrl(null);
    setCurrentPlaylistHistoryId(null);
    setPlaybackCurrentTime(0);
    setPlaybackDuration(0);
  };
  
  // 플레이리스트 새로고침 핸들러
  const handleRefreshPlaylists = async () => {
    setIsLoadingPlaylists(true);
    try {
      const playlists = await driveApi.getPlaylists(userId);
      setPlaylists(playlists);
    } catch (error) {
      console.error("플레이리스트 새로고침 실패:", error);
      setStatus("error");
      setStatusMessage("플레이리스트를 불러오는 중 오류가 발생했습니다");
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // 히스토리 항목 재생 핸들러
  const handleHistoryItemPlay = async (historyItem) => {
    if (!historyItem.historyId) return;
    
    try {
      setIsLoadingPlaylist(true);
      // 히스토리에서 플레이리스트 정보 가져오기
      const historyData = await driveApi.getHistoryById(historyItem.historyId);
      
      if (historyData) {
        // 히스토리 정보로 플레이리스트 재생 설정
        setPlaylistNewsList(historyData.newsList || []);
        setSelectedPlaylist({
          id: historyData.playlistId || "history",
          title: historyData.playlistTitle || "히스토리",
        });
        
        // 히스토리 TTS 재생
        const audioUrl = await driveApi.getHistoryTTS(historyItem.historyId);
        setCurrentPlaylistAudioUrl(audioUrl);
        setCurrentPlaylistHistoryId(historyItem.historyId);
        
        // 저장된 재생 위치부터 재생
        if (historyData.currentTime && historyData.currentTime > 0) {
          setPlaybackCurrentTime(historyData.currentTime);
        }
        
        setIsHistoryPanelCollapsed(true);
        setShowPlaylistSelection(false);
        setIsPlaybackPlaying(true);
      }
    } catch (error) {
      console.error("히스토리 재생 실패:", error);
      setStatus("error");
      // TTS 파일이 없을 때 에러 처리
      if (error.message && (error.message.includes("404") || error.message.includes("TTS_FILE_NOT_FOUND") || error.message.includes("오디오 파일을 찾을 수 없습니다"))) {
        setStatusMessage("이 플레이리스트의 오디오 파일을 찾을 수 없습니다.");
      } else {
        setStatusMessage("히스토리 재생 중 오류가 발생했습니다");
      }
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  if (selectedPlaylist && !showPlaylistSelection) {
    return (
      <PlaylistPlayback
        playlistTitle={selectedPlaylist.title}
        playlistImage={`/static/images/playlists/${selectedPlaylist.id}.png`}
        newsList={playlistNewsList}
        audioUrl={currentPlaylistAudioUrl}
        onPlayPause={handlePlaybackPlayPause}
        onClose={onClose}
        onBack={handleBackToSelection}
        onHistoryOpen={toggleHistoryPanel}
        currentTime={playbackCurrentTime}
        duration={playbackDuration}
        isPlaying={isPlaybackPlaying}
        onSeek={handlePlaybackSeek}
        showHistory={!isHistoryPanelCollapsed}
        historyList={history}
        onHistoryItemPlay={handleHistoryItemPlay}
        onHistoryItemDelete={deleteHistory}
        onHistoryClose={() => setIsHistoryPanelCollapsed(true)}
        onMicrophoneButtonClick={handleMicrophoneButtonClick}
        onMicrophoneButtonUp={handleMicrophoneButtonUp}
        audioLevel={demoRecording ? demoAudioLevel : audioLevel}
        isRecording={isRecording || demoRecording}
        statusMessage={statusMessage}
        recognizedText={recognizedText}
      />
    );
  }

  return (
    <PlaylistSelection
      playlists={playlists}
      onSelect={handlePlaylistSelect}
      isLoading={isLoadingPlaylists || isLoadingPlaylist}
      onRefresh={handleRefreshPlaylists}
      onClose={onClose}
      historyList={history}
      onHistoryLoad={loadHistory}
      onHistoryItemPlay={handleHistoryItemPlay}
      onHistoryItemDelete={deleteHistory}
      onMicrophoneButtonClick={handleMicrophoneButtonClick}
      onMicrophoneButtonUp={handleMicrophoneButtonUp}
      audioLevel={demoRecording ? demoAudioLevel : audioLevel}
      isRecording={isRecording || demoRecording}
      statusMessage={statusMessage}
      recognizedText={recognizedText}
    />
  );

  // 기존 코드는 주석 처리 (나중에 필요하면 사용)
  /*
  return (
    <div style={drivePageStyles.page}>
      <div style={drivePageStyles.backgroundLayer}>
        <div style={drivePageStyles.gradient} />
        <div style={drivePageStyles.smoke} />
      </div>
      <style>{`
        @keyframes backgroundPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes smokeDrift { 0% { transform: translate(-10%, -10%) scale(1.2); } 50% { transform: translate(10%, 5%) scale(1.25); } 100% { transform: translate(-10%, -10%) scale(1.2); } }
      `}</style>
      <div style={drivePageStyles.content}>
        <div style={drivePageStyles.hudWrapper}>
          <BentoGridHUD
            status={status}
            statusMessage={statusMessage}
            recognizedText={recognizedText}
            audioLevel={demoRecording ? demoAudioLevel : audioLevel}
            isRecording={isRecording || demoRecording}
            currentNewsId={currentNewsId}
            onMicrophoneButtonClick={handleMicrophoneButtonClick}
            onMicrophoneButtonUp={handleMicrophoneButtonUp}
            currentNews={currentNews}
            playbackProgress={playbackProgress}
            onPlayPause={handlePlayPause}
            onNext={playNextNews}
            onStop={stopDriveMode}
            onClose={onClose}
            history={history}
            onHistoryPanelOpen={openHistoryPanel}
            onHistoryLoad={loadHistory}
            onHistoryDelete={deleteHistory}
            onHistoryPlay={playHistoryNews}
            showResumeChoice={showResumeChoice}
            onResumeChoice={handleResumeChoice}
            isResumeMode={showResumeChoice || !!resumeInfo}
          />
        </div>
        {!isHistoryPanelCollapsed && (
          <div style={drivePageStyles.historyPanel}>
            <div style={drivePageStyles.historyHeader}>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#F1F5F9" }}>청취 히스토리</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={loadHistory} style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#94A3B8", borderRadius: "10px", padding: "8px 14px", cursor: "pointer" }}>새로고침</button>
                <button onClick={() => setIsHistoryPanelCollapsed(true)} style={{ width: "36px", height: "36px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", borderRadius: "10px", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
              </div>
            </div>
            <div style={{ ...drivePageStyles.historyListWrap, gap: "24px" }}>
              {renderHistoryPanelContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  */
}

export default DriveModePage;
