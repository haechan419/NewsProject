import { useRef } from "react";
import { MicrophoneIcon } from "./Icons";

const LONG_PRESS_MS = 600;
/** 손 뗀 뒤 클릭 지연: 길게 누름 타이머 콜백이 먼저 실행되도록 (0ms는 레이스 가능) */
const CLICK_DEFER_MS = 30;

/**
 * 마이크 버튼 (브리핑 배송과 동일한 탭-탭 방식):
 * - 한 번 누르면 녹음 시작, 한 번 더 누르면 녹음 종료·전송.
 * - enableLongPressForDemo 시 0.6초 길게 누르면 번호키 모드 진입 (미사용 시 숨은 버튼으로 데모 진입).
 */
export function MicButtonWithLongPress({
  onMicrophoneButtonClick,
  onMicrophoneButtonUp,
  showNumberKeyChoice,
  onNumberKeyChoiceClick,
  enableLongPressForDemo = false,
  className = "",
  iconSize = 20,
}) {
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  const clearTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (e) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    longPressFiredRef.current = false;
    if (enableLongPressForDemo && showNumberKeyChoice && onNumberKeyChoiceClick) {
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        longPressFiredRef.current = true;
        onNumberKeyChoiceClick();
      }, LONG_PRESS_MS);
    }
    // 탭-탭 방식: 누를 때가 아니라 뗄 때 한 번만 클릭 처리
  };

  const handlePointerUp = (e) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    clearTimer();
    if (longPressFiredRef.current) return;
    // 짧은 지연으로 길게 누름 타이머 콜백이 먼저 실행되도록 함 (길게 누름 → 데모만, 녹음 미시작)
    setTimeout(() => {
      if (longPressFiredRef.current) return;
      onMicrophoneButtonClick?.();
    }, CLICK_DEFER_MS);
    // release 시 별도 stop 호출 없음. 두 번째 탭에서 handleMicrophoneButtonClick이 stop 처리
  };

  return (
    <button
      type="button"
      onMouseDown={handlePointerDown}
      onMouseUp={handlePointerUp}
      onMouseLeave={clearTimer}
      onTouchStart={handlePointerDown}
      onTouchEnd={handlePointerUp}
      onTouchCancel={clearTimer}
      className={className}
      title="음성 명령"
      aria-label="마이크"
    >
      <MicrophoneIcon size={iconSize} color="currentColor" />
    </button>
  );
}
