import { useEffect, useRef } from "react";

export function VoiceVisualizer({ audioLevel, isActive }) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const barsRef = useRef(Array(24).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // 대기 시: 얇은 막대만 한 번 그리기 (루프 없음)
        const barCount = 24;
        const barW = width / barCount;
        for (let i = 0; i < barCount; i++) {
          const h = height * 0.12 * (0.4 + Math.sin(i * 0.5) * 0.3);
          const x = i * barW + barW * 0.2;
          const y = (height - h) / 2;
          ctx.fillStyle = "rgba(148, 163, 184, 0.15)";
          roundRect(ctx, x, y, barW * 0.6, h, 2);
          ctx.fill();
        }
        return;
      }

      const barCount = 24;
      const barW = width / barCount;
      const normalizedLevel = Math.max(0, Math.min(1, (audioLevel + 60) / 40));

      for (let i = 0; i < barCount; i++) {
        const targetH = height * 0.45 * normalizedLevel * (0.4 + Math.sin(i * 0.4) * 0.3 + Math.random() * 0.3);
        barsRef.current[i] = barsRef.current[i] * 0.72 + targetH * 0.28;
      }

      for (let i = 0; i < barCount; i++) {
        const h = Math.max(2, barsRef.current[i]);
        const x = i * barW + barW * 0.2;
        const y = (height - h) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + h);
        gradient.addColorStop(0, "rgba(56, 189, 248, 0.85)");
        gradient.addColorStop(0.5, "rgba(14, 165, 233, 0.9)");
        gradient.addColorStop(1, "rgba(2, 132, 199, 0.75)");

        ctx.fillStyle = gradient;
        roundRect(ctx, x, y, barW * 0.6, h, 3);
        ctx.fill();

        ctx.shadowColor = "rgba(56, 189, 248, 0.5)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    function roundRect(ctx, x, y, w, h, r) {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    draw();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [audioLevel, isActive]);

  return (
    <div className="w-full max-w-sm mx-auto px-2">
      <div
        className="overflow-hidden rounded-full border border-white/[0.06] bg-slate-900/40 backdrop-blur-sm"
        style={{ height: "44px" }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={44}
          className="w-full h-full block"
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}
