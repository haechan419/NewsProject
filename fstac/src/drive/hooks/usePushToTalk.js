import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Push-to-Talk 녹음 훅
 * 버튼 누름/뗌 방식, 상대적 침묵 감지
 */
export function usePushToTalk(options = {}) {
  const {
    onRecordingStart,
    onRecordingEnd,
    maxDuration = 10000,
    silenceDuration = 1500,
    minSpeechDuration = 400,
    absoluteSpeechThreshold = -45,
    relativeSilenceDb = 12,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animationFrameRef = useRef(null);
  const maxDurationTimerRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const silenceStartTimeRef = useRef(null);
  const maxLevelRef = useRef(-Infinity);
  const speechConfirmedRef = useRef(false);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const db = 20 * Math.log10(average / 255) || -Infinity;

    setAudioLevel(db);

    const now = Date.now();
    const elapsed = recordingStartTimeRef.current ? now - recordingStartTimeRef.current : 0;

    if (Number.isFinite(db) && db > maxLevelRef.current) {
      maxLevelRef.current = db;
    }

    if (elapsed >= minSpeechDuration && maxLevelRef.current > absoluteSpeechThreshold) {
      speechConfirmedRef.current = true;
    }

    const isRelativeSilence = speechConfirmedRef.current && Number.isFinite(maxLevelRef.current) && db < maxLevelRef.current - relativeSilenceDb;

    if (isRelativeSilence) {
      if (silenceStartTimeRef.current === null) {
        silenceStartTimeRef.current = now;
      } else {
        const silenceElapsed = now - silenceStartTimeRef.current;
        if (silenceElapsed >= silenceDuration) {
          console.log(`[Push-to-Talk] 침묵 감지 자동 종료`);
          stopRecording();
          return;
        }
      }
    } else {
      silenceStartTimeRef.current = null;
    }

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [isRecording, silenceDuration, minSpeechDuration, absoluteSpeechThreshold, relativeSilenceDb]);

  const startRecording = useCallback(async () => {
    try {
      if (isRecording) return;

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      const constraints = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (stream.getAudioTracks().length === 0) throw new Error("오디오 입력 장치 없음");

      mediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      if (!mimeType) throw new Error("지원되는 오디오 형식 없음");

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recordingStartTimeRef.current = Date.now();
      silenceStartTimeRef.current = null;
      maxLevelRef.current = -Infinity;
      speechConfirmedRef.current = false;
      mediaRecorder.start();
      setIsRecording(true);

      analyzeAudio();

      maxDurationTimerRef.current = setTimeout(() => {
        console.log("[Push-to-Talk] 최대 시간 도달 자동 종료");
        stopRecording();
      }, maxDuration);

      onRecordingStart?.();
    } catch (error) {
      const isNoDevice = error?.name === "NotFoundError" || String(error?.message || "").includes("Requested device not found");
      if (!isNoDevice) console.error("[Push-to-Talk] 녹음 시작 실패:", error);
      
      let errorMessage = "마이크 접근 실패";
      if (error.name === "NotAllowedError") errorMessage = "마이크 권한 거부됨";
      else if (error.name === "NotReadableError") errorMessage = "마이크 사용 중";
      else if (error.name === "NotFoundError") errorMessage = "마이크 찾을 수 없음";
      
      throw new Error(errorMessage);
    }
  }, [isRecording, maxDuration, onRecordingStart, analyzeAudio]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return null;

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      const recordingDuration = recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : 0;
      const MIN_RECORDING_DURATION = 300;

      if (mediaRecorder.state === "recording") {
        mediaRecorder.onstop = () => {
          if (recordingDuration < MIN_RECORDING_DURATION) {
            resolve(null);
            return;
          }
          const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
          resolve(blob);
        };
        mediaRecorder.stop();
      } else {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || "audio/webm" });
        resolve(blob.size > 0 ? blob : null);
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
        maxDurationTimerRef.current = null;
      }

      setIsRecording(false);
      setAudioLevel(-Infinity);
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = null;
      silenceStartTimeRef.current = null;
      maxLevelRef.current = -Infinity;
      speechConfirmedRef.current = false;

      onRecordingEnd?.();
    });
  }, [isRecording, onRecordingEnd]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (maxDurationTimerRef.current) clearTimeout(maxDurationTimerRef.current);
    };
  }, []);

  return { isRecording, audioLevel, startRecording, stopRecording };
}
