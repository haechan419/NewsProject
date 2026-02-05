import { useState } from "react";

/**
 * 드라이브 모드 UI 상태만 관리하는 훅
 * 상태/사이드이펙트 분리: 상태 선언만 담당
 */
export function useDriveModeState() {
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [recognizedText, setRecognizedText] = useState(null);
  const [currentNews, setCurrentNews] = useState(null);
  const [newsQueue, setNewsQueue] = useState([]);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [briefingAudioUrl, setBriefingAudioUrl] = useState(null);
  const [djBriefingAudioUrl, setDjBriefingAudioUrl] = useState(null);
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [history, setHistory] = useState([]);
  const [showResumeChoice, setShowResumeChoice] = useState(false);
  const [isHistoryPanelCollapsed, setIsHistoryPanelCollapsed] = useState(true);

  const [demoRecording, setDemoRecording] = useState(false);
  const [demoAudioLevel, setDemoAudioLevel] = useState(-60);
  const [demoCommandKey, setDemoCommandKey] = useState(1);
  const [useDemoFallback, setUseDemoFallback] = useState(false);

  return {
    status,
    setStatus,
    statusMessage,
    setStatusMessage,
    recognizedText,
    setRecognizedText,
    currentNews,
    setCurrentNews,
    newsQueue,
    setNewsQueue,
    resumeInfo,
    setResumeInfo,
    briefingAudioUrl,
    setBriefingAudioUrl,
    djBriefingAudioUrl,
    setDjBriefingAudioUrl,
    isPlayingBriefing,
    setIsPlayingBriefing,
    history,
    setHistory,
    showResumeChoice,
    setShowResumeChoice,
    isHistoryPanelCollapsed,
    setIsHistoryPanelCollapsed,
    demoRecording,
    setDemoRecording,
    demoAudioLevel,
    setDemoAudioLevel,
    demoCommandKey,
    setDemoCommandKey,
    useDemoFallback,
    setUseDemoFallback,
  };
}
