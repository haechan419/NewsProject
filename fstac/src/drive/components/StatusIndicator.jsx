import {
  PlayIcon,
  PauseIcon,
  MicrophoneIcon,
  SettingsIcon,
  ErrorIcon,
} from "./Icons";

export function StatusIndicator({ status, message }) {
  const statusConfig = {
    idle: {
      color: "#6b7280",
      gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
      label: "대기 중",
      icon: <PauseIcon size={28} color="#6b7280" />,
      glow: "rgba(107, 114, 128, 0.3)",
    },
    listening: {
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      label: "듣는 중",
      icon: <MicrophoneIcon size={28} color="#3b82f6" />,
      glow: "rgba(59, 130, 246, 0.4)",
    },
    processing: {
      color: "#FF8C42",
      gradient: "linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)",
      label: "처리 중",
      icon: <SettingsIcon size={28} color="#FF8C42" />,
      glow: "rgba(255, 140, 66, 0.5)",
    },
    playing: {
      color: "#10B981",
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      label: "재생 중",
      icon: <PlayIcon size={28} color="#10B981" />,
      glow: "rgba(16, 185, 129, 0.6)",
    },
    recording: {
      color: "#3B82F6",
      gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      label: "녹음 중",
      icon: <MicrophoneIcon size={28} color="#3B82F6" />,
      glow: "rgba(59, 130, 246, 0.5)",
    },
    success: {
      color: "#10B981",
      gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      label: "성공",
      icon: <PlayIcon size={28} color="#10B981" />,
      glow: "rgba(16, 185, 129, 0.4)",
    },
    error: {
      color: "#F87171",
      gradient: "linear-gradient(135deg, #F87171 0%, #EF4444 100%)",
      label: "오류",
      icon: <ErrorIcon size={28} color="#F87171" />,
      glow: "rgba(248, 113, 113, 0.4)",
    },
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px 20px",
        background: "rgba(26, 26, 26, 0.4)",
        backdropFilter: "blur(20px)",
        borderRadius: "20px",
        border: `1px solid ${config.color}30`,
        boxShadow: `0 8px 32px ${config.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: config.gradient,
          opacity: 0.1,
          zIndex: 0,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          position: "relative",
          zIndex: 1,
          filter: `drop-shadow(0 0 8px ${config.glow})`,
          animation:
            status === "listening" || status === "processing" || status === "recording"
              ? "pulse 1.5s infinite"
              : "none",
        }}
      >
        {config.icon}
      </div>

      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <div
          style={{
            color: config.color,
            fontWeight: "800",
            fontSize: "17px",
            marginBottom: "4px",
            textShadow: `0 0 16px ${config.glow}, 0 2px 4px rgba(0, 0, 0, 0.3)`,
            letterSpacing: "0.8px",
            lineHeight: "1.4",
          }}
        >
          {config.label}
        </div>
        {message && (
          <div
            style={{
              color: "#d1d5db",
              fontSize: "14px",
              fontWeight: "600",
              lineHeight: "1.5",
              letterSpacing: "0.2px",
            }}
          >
            {message}
          </div>
        )}
      </div>

      <div
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background: config.gradient,
          boxShadow: `0 0 12px ${config.glow}`,
          animation:
            status === "listening" || status === "processing" || status === "recording"
              ? "pulse 1.5s infinite"
              : "none",
          position: "relative",
          zIndex: 1,
        }}
      />

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
