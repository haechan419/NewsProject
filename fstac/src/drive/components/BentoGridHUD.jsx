import { useState, useEffect, useRef } from "react";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { CircularProgressGauge } from "./CircularProgressGauge";
import { StatusIndicator } from "./StatusIndicator";
import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  CloseIcon,
  HistoryIcon,
  TrashIcon,
  MicrophoneIcon,
} from "./Icons";

const HUDStyles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(135deg, #0F172A 0%, #020617 100%)",
    color: "#F8FAFC",
    fontFamily:
      "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    zIndex: 9999,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backgroundNoise: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    opacity: 0.03,
    pointerEvents: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  },
  topBar: {
    width: "100%",
    padding: "20px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  logo: {
    fontSize: "18px",
    fontWeight: "800",
    letterSpacing: "1px",
    color: "rgba(255, 255, 255, 0.9)",
    textTransform: "uppercase",
  },
  clock: {
    fontSize: "16px",
    fontWeight: "500",
    fontVariantNumeric: "tabular-nums",
    color: "rgba(255, 255, 255, 0.7)",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },
  controlDock: {
    marginBottom: "40px",
    padding: "16px 24px",
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    gap: "24px",
    boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)",
    zIndex: 100,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  dockButton: {
    base: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      border: "none",
      outline: "none",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    primary: {
      width: "64px",
      height: "64px",
      borderRadius: "50%",
      background: "#F8FAFC",
      color: "#0F172A",
      boxShadow: "0 0 20px rgba(255, 255, 255, 0.2)",
    },
    secondary: {
      width: "48px",
      height: "48px",
      borderRadius: "16px",
      background: "rgba(255, 255, 255, 0.05)",
      color: "rgba(255, 255, 255, 0.8)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
    },
    accent: {
      width: "56px",
      height: "56px",
      borderRadius: "20px",
      background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      color: "#FFFFFF",
      boxShadow: "0 8px 20px -4px rgba(59, 130, 246, 0.5)",
    },
  },
};

export function BentoGridHUD({
  status,
  statusMessage,
  recognizedText,
  audioLevel,
  isRecording,
  currentNewsId,
  onMicrophoneButtonClick,
  onMicrophoneButtonUp,
  currentNews,
  playbackProgress,
  onPlayPause,
  onNext,
  onStop,
  onClose,
  history = [],
  onHistoryLoad,
  onHistoryDelete,
  onHistoryPlay,
  onHistoryPanelOpen,
  showResumeChoice = false,
  onResumeChoice,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isAnnouncement = !currentNewsId;

  const [displayStatusMessage, setDisplayStatusMessage] = useState(statusMessage || "");
  const lastMessageChangeAtRef = useRef(0);
  const messageTimerRef = useRef(null);
  useEffect(() => {
    const raw = statusMessage || "";
    const isImportantMessage =
      status === "error" ||
      /권한|네트워크|연결|오류|실패|찾을 수 없습니다|불러올 수 없습니다|문제가 발생/.test(raw);

    const now = Date.now();
    const MIN_VISIBLE_MS = 800;
    const elapsed = now - lastMessageChangeAtRef.current;

    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }

    if (isImportantMessage) {
      lastMessageChangeAtRef.current = now;
      setDisplayStatusMessage(raw);
      return;
    }

    if (elapsed >= MIN_VISIBLE_MS) {
      lastMessageChangeAtRef.current = now;
      setDisplayStatusMessage(raw);
      return;
    }

    messageTimerRef.current = setTimeout(() => {
      lastMessageChangeAtRef.current = Date.now();
      setDisplayStatusMessage(raw);
      messageTimerRef.current = null;
    }, MIN_VISIBLE_MS - elapsed);

    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, [statusMessage, status]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getStatusColor = () => {
    switch (status) {
      case "playing": return "#10B981";
      case "recording": return "#3B82F6";
      case "listening": return "#3B82F6";
      case "processing": return "#F59E0B";
      case "success": return "#10B981";
      case "error": return "#EF4444";
      default: return "#64748B";
    }
  };

  return (
    <div style={HUDStyles.container}>
      <div style={HUDStyles.backgroundNoise} />

      <div style={HUDStyles.topBar}>
        <div style={HUDStyles.logo}>DRIVE MODE</div>
        <div style={HUDStyles.clock}>{formatTime(currentTime)}</div>
        
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => {
              if (onHistoryPanelOpen) {
                onHistoryPanelOpen();
              } else if (onHistoryLoad) {
                onHistoryLoad();
              }
            }}
            style={{
              ...HUDStyles.dockButton.base,
              ...HUDStyles.dockButton.secondary,
              width: "auto",
              padding: "0 16px",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
          >
            <HistoryIcon size={18} color="rgba(255,255,255,0.8)" />
            <span>히스토리</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                ...HUDStyles.dockButton.base,
                ...HUDStyles.dockButton.secondary,
                borderColor: "rgba(239, 68, 68, 0.3)",
                color: "#EF4444",
                background: "rgba(239, 68, 68, 0.1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)")}
            >
              <CloseIcon size={20} color="#EF4444" />
            </button>
          )}
        </div>
      </div>

      <div style={HUDStyles.mainContent}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <CircularProgressGauge
            progress={playbackProgress}
            size={380}
            strokeWidth={24}
            currentNews={currentNews}
            status={status}
            isAnnouncement={isAnnouncement}
          />
          
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "420px",
              height: "420px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${getStatusColor()} 0%, transparent 70%)`,
              opacity: 0.15,
              filter: "blur(40px)",
              pointerEvents: "none",
              zIndex: -1,
            }}
          />
        </div>

        <div style={{ marginTop: "24px", width: "100%", maxWidth: "480px" }}>
          <VoiceVisualizer audioLevel={audioLevel} isActive={isRecording} />
        </div>

        <div
          style={{
            marginTop: "24px",
            width: "100%",
            maxWidth: "520px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            minHeight: "0",
          }}
        >
          {displayStatusMessage && (
            <div style={{ width: "100%", flexShrink: 0 }}>
              <StatusIndicator status={status} message={displayStatusMessage} />
            </div>
          )}
          {recognizedText && (
            <div
              style={{
                width: "100%",
                padding: "14px 24px",
                background: "rgba(59, 130, 246, 0.12)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "100px",
                color: "#60A5FA",
                fontSize: "18px",
                fontWeight: "600",
                animation: "fadeIn 0.3s ease-out",
                textAlign: "center",
                boxShadow: "0 4px 20px rgba(59, 130, 246, 0.15)",
                flexShrink: 0,
              }}
            >
              "{recognizedText}"
            </div>
          )}
        </div>
      </div>

      {!showResumeChoice ? (
        <div style={HUDStyles.controlDock}>
          <button
            onClick={onNext}
            title="다음 뉴스"
            style={{
              ...HUDStyles.dockButton.base,
              ...HUDStyles.dockButton.secondary,
              minWidth: "52px",
              minHeight: "52px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <NextIcon size={32} color="currentColor" />
          </button>

          <button
            onClick={onPlayPause}
            title={status === "playing" ? "일시정지" : "재생"}
            style={{
              ...HUDStyles.dockButton.base,
              ...HUDStyles.dockButton.primary,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {status === "playing" ? (
              <PauseIcon size={32} color="#0F172A" />
            ) : (
              <PlayIcon size={32} color="#0F172A" />
            )}
          </button>

          {onMicrophoneButtonClick && (
            <button
              onMouseDown={onMicrophoneButtonClick}
              onMouseUp={onMicrophoneButtonUp}
              onTouchStart={onMicrophoneButtonClick}
              onTouchEnd={onMicrophoneButtonUp}
              title="음성 명령"
              style={{
                ...HUDStyles.dockButton.base,
                ...HUDStyles.dockButton.accent,
                animation: isRecording ? "pulseGlow 2s infinite" : "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <MicrophoneIcon size={28} color="#FFFFFF" />
            </button>
          )}
        </div>
      ) : (
        <div style={{ ...HUDStyles.controlDock, flexDirection: "column", background: "transparent", border: "none", boxShadow: "none" }}>
           <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#ffffff",
                marginBottom: "8px",
              }}
            >
              어떻게 시작할까요?
            </div>
            {onMicrophoneButtonClick && (
              <button
                onMouseDown={onMicrophoneButtonClick}
                onMouseUp={onMicrophoneButtonUp}
                onTouchStart={onMicrophoneButtonClick}
                onTouchEnd={onMicrophoneButtonUp}
                title="음성으로 선택"
                style={{
                  ...HUDStyles.dockButton.base,
                  ...HUDStyles.dockButton.accent,
                  width: "56px",
                  height: "56px",
                  borderRadius: "18px",
                  marginBottom: "12px",
                  animation: isRecording ? "pulseGlow 2s infinite" : "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <MicrophoneIcon size={28} color="#FFFFFF" />
              </button>
            )}
            <div style={{ display: "flex", gap: "16px" }}>
              <button
                onClick={() => onResumeChoice("resume")}
                style={{
                  ...HUDStyles.dockButton.base,
                  padding: "16px 32px",
                  background: "rgba(59, 130, 246, 0.2)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  borderRadius: "16px",
                  color: "#60A5FA",
                  fontWeight: "600",
                  gap: "8px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <PlayIcon size={20} /> 이어듣기
              </button>
              <button
                onClick={() => onResumeChoice("new")}
                style={{
                  ...HUDStyles.dockButton.base,
                  padding: "16px 32px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "16px",
                  color: "#FFFFFF",
                  fontWeight: "600",
                  gap: "8px",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <NextIcon size={20} /> 새 브리핑
              </button>
            </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } 
        }
      `}</style>
    </div>
  );
}