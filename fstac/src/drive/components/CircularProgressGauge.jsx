import { PlayIcon, PauseIcon, MicrophoneIcon } from "./Icons";

export function CircularProgressGauge({
  progress = 0,
  size = 300,
  strokeWidth = 20,
  currentNews = null,
  status = "idle",
  isAnnouncement = false,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isFixedMessage = isAnnouncement || !currentNews || !currentNews.newsId;

  const getColor = () => {
    if (isFixedMessage) {
      return {
        gradient: ["#6B7280", "#9CA3AF", "#D1D5DB"],
        glow: "rgba(107, 114, 128, 0.15)",
      };
    }

    switch (status) {
      case "playing":
        return {
          gradient: ["#10B981", "#34D399", "#6EE7B7"],
          glow: "rgba(16, 185, 129, 0.4)",
        };
      case "listening":
        return {
          gradient: ["#3B82F6", "#60A5FA"],
          glow: "rgba(59, 130, 246, 0.4)",
        };
      case "processing":
        return {
          gradient: ["#F59E0B", "#FBBF24"],
          glow: "rgba(245, 158, 11, 0.4)",
        };
      default:
        return {
          gradient: ["#6B7280", "#9CA3AF"],
          glow: "rgba(107, 114, 128, 0.2)",
        };
    }
  };

  const colors = getColor();

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          position: "absolute",
          transform: "rotate(-90deg)",
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(0, 0, 0, 0.2)"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />

        {isFixedMessage ? (
          <>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.10)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.10} ${circumference * 0.90}`}
              strokeDashoffset={0}
              style={{
                filter: "none",
                animation: status === "paused" ? "none" : "indeterminateRing 5s linear infinite",
              }}
            />
          </>
        ) : (
          <>
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                {colors.gradient.map((color, index) => (
                  <stop
                    key={index}
                    offset={`${(index / (colors.gradient.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 0.3s ease-out",
                filter: `drop-shadow(0 0 12px ${colors.glow})`,
              }}
            />
          </>
        )}
      </svg>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
        }}
      >
        {/* 진행률 퍼센트: 뉴스 재생 중에만 표시 */}
        {!isFixedMessage && (
          <div
            style={{
              fontSize: "52px",
              fontWeight: "800",
              color: "#FFFFFF",
              lineHeight: 1,
              marginBottom: "8px",
              textShadow: `0 0 24px ${colors.glow}, 0 2px 8px rgba(0, 0, 0, 0.3)`,
              fontFeatureSettings: '"tnum" 1',
              letterSpacing: "-1px",
            }}
          >
            {Math.round(progress)}%
          </div>
        )}

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 10px",
            borderRadius: "999px",
            marginBottom: "10px",
            background: "rgba(255, 255, 255, 0.04)",
            border: `1px ${isFixedMessage ? "dashed" : "solid"} rgba(255, 255, 255, 0.14)`,
            color: "rgba(255, 255, 255, 0.75)",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
          }}
        >
          {isFixedMessage ? "안내 멘트" : "뉴스"}
        </div>

        {currentNews ? (
          <>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#9CA3AF",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {currentNews.category}
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "600",
                color: "#FFFFFF",
                padding: "0 20px",
                lineHeight: "1.4",
                maxHeight: "60px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
            >
              {currentNews.title || "뉴스 브리핑"}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "#6B7280",
              marginTop: "8px",
              lineHeight: "1.5",
            }}
          >
            재생 대기 중
          </div>
        )}

        <div
          style={{
            marginTop: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: status === "playing" ? 1 : 0.5,
            animation: status === "playing" ? "pulse 2s infinite" : "none",
            lineHeight: 1,
          }}
        >
          {status === "playing" ? (
            <PlayIcon size={20} color="#FFFFFF" />
          ) : status === "listening" ? (
            <MicrophoneIcon size={20} color="#FFFFFF" />
          ) : (
            <PauseIcon size={20} color="#FFFFFF" />
          )}
        </div>
      </div>

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
        @keyframes indeterminateRing {
          0% { stroke-dashoffset: 0; transform: rotate(0deg); transform-origin: 50% 50%; }
          100% { stroke-dashoffset: ${-circumference}; transform: rotate(360deg); transform-origin: 50% 50%; }
        }
      `}</style>
    </div>
  );
}
