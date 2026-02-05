import { useRef } from "react";

const COMMAND_COOLDOWN = 1000;

/**
 * 드라이브 모드 ref 모음 훅
 * 상태/사이드이펙트 분리: ref 선언만 담당
 */
export function useDriveModeRefs() {
  const briefingAudioUrlRef = useRef(null);
  const djBriefingAudioUrlRef = useRef(null);
  const isPlayingBriefingRef = useRef(false);
  const resumeInfoRef = useRef(null);
  const showResumeChoiceRef = useRef(false);
  const waitTimerRef = useRef(null);
  const isPlayingNextNewsRef = useRef(false);
  const lastProcessedNewsIdRef = useRef(null);
  const pendingEntryDataRef = useRef(null);
  const newsQueueRef = useRef([]);
  const isMountedRef = useRef(true);

  const fixedMessageAudioRef = useRef(null);
  const fixedMessageSessionRef = useRef(0);
  const enterDriveModeInProgressRef = useRef(false);
  const initRetryCountRef = useRef(0);
  const commandRetryCountRef = useRef(0);
  const newsStartTimeRef = useRef(null);
  const currentNewsIdRef = useRef(null);
  const pausedTimeRef = useRef(null);
  const totalPausedDurationRef = useRef(0);
  const ttsFailureCountRef = useRef(0);
  const lastCommandTimeRef = useRef(0);
  const isProcessingCommandRef = useRef(false);

  const commandRetryTimerRef = useRef(null);
  const initRetryTimerRef = useRef(null);
  const historyLoadTimerRef = useRef(null);
  const nextNewsTimerRef = useRef(null);
  const statusTimerRef = useRef(null);
  const textHideTimerRef = useRef(null);

  const demoLevelIntervalRef = useRef(null);
  const demoLevelPhaseRef = useRef(0);
  const demoKeyPressedThisSessionRef = useRef(false);

  return {
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
  };
}
