import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { briefDeliveryApi } from '../api/briefDeliveryApi';
import newsIcon from '../assets/news.png';
import chatIcon from '../assets/chat.png';
import micIcon from '../assets/microphone-black-shape.png';
import './FloatingBriefDelivery.css';

/** Demo voice: key 1–4 → MP3 file, sent as voice input to analyzeVoice API */
const DEMO_MP3_ENTRIES = [
  { key: 1, file: 'brief_1.mp3', label: '내일 아침 10시' },
  { key: 2, file: 'brief_2.mp3', label: '내일 오전 8시' },
  { key: 3, file: 'brief_3.mp3', label: '오늘 15시 30분' },
  { key: 4, file: 'brief_4.mp3', label: '테스트용(몇 분 뒤)' },
];
const getDemoMp3Url = (filename) => new URL(`../demo/${filename}`, import.meta.url).href;

const FloatingBriefDelivery = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id ?? null;
  const demoVoice = import.meta.env.VITE_DEMO_VOICE === 'true';

  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'mic' | 'text'
  const [textInput, setTextInput] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [demoRecording, setDemoRecording] = useState(false);
  const [demoCommandKey, setDemoCommandKey] = useState(1);
  const [useDemoFallback, setUseDemoFallback] = useState(false);
  const [useDemoByChoice, setUseDemoByChoice] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const textInputRef = useRef(null);
  const demoKeyPressedThisSessionRef = useRef(false);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
    if (isExpanded) {
      setIsOpen(false);
      setMode(null);
    }
  };

  const handleOpenPanel = (selectedMode) => {
    if (isOpen && mode === selectedMode) {
      setIsOpen(false);
      setMode(null);
      return;
    }
    setMode(selectedMode);
    setIsOpen(true);
    setMessage('');
    setError('');
    if (selectedMode === 'mic') {
      setDemoRecording(false);
      setUseDemoFallback(false);
      setUseDemoByChoice(false);
    }
    if (selectedMode === 'text') {
      setTextInput('');
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setMode(null);
    setDemoRecording(false);
    setUseDemoFallback(false);
    setUseDemoByChoice(false);
  };

  const handleSwitchMode = () => {
    const nextMode = mode === 'text' ? 'mic' : 'text';
    setMode(nextMode);
    setMessage('');
    setError('');
    if (nextMode === 'mic') {
      setDemoRecording(false);
      setUseDemoFallback(false);
      setUseDemoByChoice(false);
    }
    if (nextMode === 'text') {
      setTextInput('');
      setTimeout(() => textInputRef.current?.focus(), 0);
    }
  };

  useEffect(() => {
    const useDemoFlow = demoVoice || useDemoFallback || useDemoByChoice;
    if (!useDemoFlow || mode !== 'mic' || !demoRecording) return;
    const onKey = (e) => {
      const k = parseInt(e.key, 10);
      if (k >= 1 && k <= 4) {
        demoKeyPressedThisSessionRef.current = true;
        setDemoCommandKey(k);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [demoVoice, useDemoFallback, useDemoByChoice, mode, demoRecording]);

  const handleDemoMicClick = async () => {
    if (!userId) return;
    if (!demoRecording) {
      setError('');
      setMessage('');
      demoKeyPressedThisSessionRef.current = false;
      setDemoRecording(true);
      return;
    }
    if (!demoKeyPressedThisSessionRef.current) {
      setError('말씀을 인식하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    const entry = DEMO_MP3_ENTRIES.find((e) => e.key === demoCommandKey);
    if (!entry) {
      setError('말씀을 인식하지 못했습니다. 다시 시도해 주세요.');
      return;
    }
    setDemoRecording(false);
    demoKeyPressedThisSessionRef.current = false;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const url = getDemoMp3Url(entry.file);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`MP3 로드 실패: ${entry.file}`);
      const blob = await res.blob();
      const result = await briefDeliveryApi.analyzeVoice(blob, userId, entry.file);
      if (result.scheduled && result.scheduledAt) {
        const at = new Date(result.scheduledAt).toLocaleString('ko-KR');
        setMessage(`${at}경 발송을 시작합니다. PDF 생성 후 메일함을 확인해 주세요`);
      } else if (result.message) {
        setError(result.message);
      } else {
        setMessage(result.message || '처리되었습니다.');
      }
    } catch (err) {
      setError(err.message || '데모 음성 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async () => {
    if (!textInput.trim() || !userId) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await briefDeliveryApi.analyzeText(textInput.trim(), userId);
      if (result.scheduled && result.scheduledAt) {
        const at = new Date(result.scheduledAt).toLocaleString('ko-KR');
        setMessage(`${at}경 발송을 시작합니다. PDF 생성 후 메일함을 확인해 주세요`);
        setTextInput('');
      } else if (result.message) {
        setError(result.message);
      } else {
        setMessage(result.message || '처리되었습니다.');
        setTextInput('');
      }
    } catch (err) {
      setError(err.message || '요청 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (!navigator.mediaDevices?.getUserMedia || !userId) {
      setError('마이크를 사용할 수 없습니다.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    setIsRecording(true);
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const result = await briefDeliveryApi.analyzeVoice(blob, userId, 'voice.webm');
          if (result.scheduled && result.scheduledAt) {
            const at = new Date(result.scheduledAt).toLocaleString('ko-KR');
            setMessage(`${at}경 발송을 시작합니다. PDF 생성 후 메일함을 확인해 주세요`);
          } else if (result.message) {
            setError(result.message);
          } else {
            setMessage(result.message || '처리되었습니다.');
          }
        } catch (err) {
          setError(err.message || '음성 분석에 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    }).catch((err) => {
      const msg = String(err?.message || '');
      const noMic =
        msg.includes('마이크') ||
        msg.includes('마이크를 찾을 수 없') ||
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('not found');
      if (noMic) {
        setUseDemoFallback(true);
        setDemoRecording(true);
        setError('');
        setMessage('');
        setLoading(false);
        setIsRecording(false);
      } else {
        setError('마이크 권한이 필요합니다.');
        setLoading(false);
        setIsRecording(false);
      }
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  if (!userId) return null;

  return (
    <>
      <div className="floating-brief-delivery-fab">
        {isExpanded && (
          <>
            <button
              type="button"
              className="floating-brief-delivery-fab-item floating-brief-delivery-fab-chat"
              onClick={() => handleOpenPanel('text')}
              title="텍스트로 입력"
              aria-label="채팅"
            >
              <img src={chatIcon} alt="채팅" className="floating-brief-delivery-fab-icon" />
            </button>
            <button
              type="button"
              className="floating-brief-delivery-fab-item floating-brief-delivery-fab-mic"
              onClick={() => handleOpenPanel('mic')}
              title="마이크로 말하기"
              aria-label="마이크"
            >
              <img src={micIcon} alt="마이크" className="floating-brief-delivery-fab-icon" />
            </button>
          </>
        )}
        <button
          type="button"
          className={`floating-brief-delivery-btn ${isExpanded ? 'floating-brief-delivery-btn-close' : ''}`}
          onClick={handleToggleExpand}
          title={isExpanded ? '닫기' : '뉴스 브리핑 예약'}
          aria-label={isExpanded ? '닫기' : '뉴스 브리핑 예약'}
        >
          {isExpanded ? (
            <span className="floating-brief-delivery-x" aria-hidden>×</span>
          ) : (
            <img src={newsIcon} alt="브리핑 배송" className="floating-brief-delivery-icon" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="floating-brief-delivery-panel" role="dialog" aria-labelledby="brief-panel-title" aria-modal="true">
          <header className="brief-panel-head">
            <div className="brief-panel-head-inner">
              <img src={newsIcon} alt="" className="brief-panel-logo" aria-hidden />
              <h2 id="brief-panel-title" className="brief-panel-title">브리핑 예약</h2>
            </div>
            <div className="brief-panel-head-actions">
              {mode === 'mic' && !demoVoice && (
                <button
                  type="button"
                  onClick={() => {
                    if (useDemoByChoice) return;
                    setUseDemoByChoice(true);
                    setError('');
                    setMessage('');
                  }}
                  className="brief-panel-help-btn"
                  aria-label="도움말"
                  title="도움말"
                >
                  ?
                </button>
              )}
              <button type="button" className="brief-panel-close" onClick={handleClose} aria-label="닫기">
                <span aria-hidden>×</span>
              </button>
            </div>
          </header>
          <div className="brief-panel-body">
            <p className="brief-panel-hint">언제 메일로 받을까요?</p>
            <p className="brief-panel-notice">뉴스 브리핑을 원하는 시간에 이메일로 보내드려요.</p>

            {mode === 'mic' && (
              <section className="brief-panel-mic" aria-label="음성으로 예약">
                {demoVoice ? (
                  <>
                    <p className="brief-panel-mic-desc">말씀해 주세요</p>
                    <p className="brief-panel-mic-example">예: 내일 9시에 보내줘, 오늘 15시에 보내줘</p>
                    {!loading ? (
                      <button
                        type="button"
                        className={`brief-record-btn ${demoRecording ? 'brief-record-btn--recording' : ''}`}
                        onClick={handleDemoMicClick}
                        aria-label={demoRecording ? '다시 탭하면 종료' : '녹음 시작'}
                      >
                        {demoRecording && <span className="brief-record-pulse" />}
                        <span className="brief-record-btn-circle">
                          <img src={micIcon} alt="" className="brief-record-icon" />
                        </span>
                        <span className="brief-record-btn-label">
                          {demoRecording ? '다시 탭하면 종료' : '말씀해 주세요'}
                        </span>
                      </button>
                    ) : (
                      <div className="brief-loading" aria-live="polite">
                        <div className="brief-loading-dots">
                          <span className="brief-loading-dot" />
                          <span className="brief-loading-dot" />
                          <span className="brief-loading-dot" />
                        </div>
                        <p className="brief-loading-text">분석 중</p>
                      </div>
                    )}
                  </>
                ) : useDemoFallback || useDemoByChoice ? (
                  <>
                    <p className="brief-panel-mic-desc">말로만 알려주세요</p>
                    <p className="brief-panel-mic-example">예: 내일 9시에 보내줘, 오늘 15시에 보내줘</p>
                    {!loading ? (
                      <button
                        type="button"
                        className={`brief-record-btn ${demoRecording ? 'brief-record-btn--recording' : ''}`}
                        onClick={handleDemoMicClick}
                        aria-label={demoRecording ? '녹음 끝내기' : '녹음 시작'}
                      >
                        {demoRecording && <span className="brief-record-pulse" />}
                        <span className="brief-record-btn-circle">
                          <img src={micIcon} alt="" className="brief-record-icon" />
                        </span>
                        <span className="brief-record-btn-label">
                          {demoRecording ? '녹음 중' : '녹음하기'}
                        </span>
                      </button>
                    ) : (
                      <div className="brief-loading" aria-live="polite">
                        <div className="brief-loading-dots">
                          <span className="brief-loading-dot" />
                          <span className="brief-loading-dot" />
                          <span className="brief-loading-dot" />
                        </div>
                        <p className="brief-loading-text">분석 중</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="brief-panel-mic-desc">말로만 알려주세요</p>
                    <p className="brief-panel-mic-example">예: 내일 9시에 보내줘, 오늘 15시에 보내줘</p>
                    {!isRecording && !loading ? (
                      <button
                        type="button"
                        className="brief-record-btn"
                        aria-label="녹음 시작"
                        onClick={startRecording}
                      >
                        <span className="brief-record-btn-circle">
                          <img src={micIcon} alt="" className="brief-record-icon" />
                        </span>
                        <span className="brief-record-btn-label">녹음하기</span>
                      </button>
                    ) : isRecording ? (
                      <button type="button" className="brief-record-btn brief-record-btn--recording" onClick={stopRecording} aria-label="녹음 끝내기">
                        <span className="brief-record-pulse" />
                        <span className="brief-record-btn-circle">
                          <img src={micIcon} alt="" className="brief-record-icon" />
                        </span>
                        <span className="brief-record-btn-label">탭하면 녹음 끝</span>
                      </button>
                    ) : (
                      <div className="brief-loading" aria-live="polite">
                        <div className="brief-loading-dots">
                          <span className="brief-loading-dot" />
                          <span className="brief-loading-dot" />
                          <span className="brief-loading-dot" />
                        </div>
                        <p className="brief-loading-text">분석 중</p>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {mode === 'text' && (
              <section className="brief-panel-text" aria-label="글으로 예약">
                <p className="brief-panel-text-desc">받고 싶은 시간을 입력하세요</p>
                <div className="brief-input-wrap">
                  <input
                    ref={textInputRef}
                    type="text"
                    placeholder="예: 내일 9시에 보내줘"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeText()}
                    className="brief-input"
                    autoFocus
                    aria-label="예약 시간 입력"
                  />
                  <button
                    type="button"
                    className="brief-send-btn"
                    onClick={handleAnalyzeText}
                    disabled={loading || !textInput.trim()}
                  >
                    {loading ? '처리 중' : '예약하기'}
                  </button>
                </div>
              </section>
            )}

            {mode && (
              <button type="button" className="brief-back" onClick={handleSwitchMode}>
                다른 방법으로 예약
              </button>
            )}

            {message && (
              <div className="brief-toast brief-toast--success" role="status">
                <span className="brief-toast-icon" aria-hidden>✓</span>
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div className="brief-toast brief-toast--error" role="alert">
                <span className="brief-toast-icon" aria-hidden>!</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingBriefDelivery;
