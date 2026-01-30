const FaceRecognitionLogin = ({
  isCameraActive,
  isVideoReady,
  cameraError,
  isRecognizing,
  isLoading,
  faceRecognitionMessage,
  autoRecognitionEnabled,
  videoRef,
  onCameraToggle,
  onFaceRecognition,
  onStopCamera,
  onAutoRecognitionToggle
}) => {
  return (
    <div className="space-y-4">
      {!isCameraActive ? (
        <button
          type="button"
          onClick={onCameraToggle}
          disabled={isLoading || isRecognizing}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-semibold flex flex-col items-center justify-center gap-2 py-6 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">📷</span>
          <span className="text-slate-900">얼굴 인식으로 로그인</span>
          <span className="text-[11px] font-normal text-slate-500">
            카메라를 켜서 등록된 얼굴로 자동 로그인합니다
          </span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-3/4 mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/60">
            {!isVideoReady && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-slate-100">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-200 border-t-transparent animate-spin" />
                <p>카메라를 준비하는 중...</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          </div>

          {cameraError ? (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 flex items-start justify-between gap-2">
              <span>{cameraError}</span>
              <button
                type="button"
                onClick={onStopCamera}
                className="shrink-0 rounded-md border border-red-200 px-2 py-0.5 text-[10px] hover:bg-red-100"
              >
                닫기
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2">
                <span className="text-[11px] text-slate-700">
                  자동 얼굴 인식 (10초마다)
                </span>
                <button
                  type="button"
                  onClick={onAutoRecognitionToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full border border-slate-300 transition ${autoRecognitionEnabled ? 'bg-emerald-400' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${autoRecognitionEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-white">
                    {autoRecognitionEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onFaceRecognition}
                  disabled={!isVideoReady || isRecognizing || isLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-xs font-semibold text-white px-3 py-2 shadow-sm hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isRecognizing ? '인식 중...' : '수동 인식'}
                </button>
                <button
                  type="button"
                  onClick={onStopCamera}
                  disabled={isRecognizing || isLoading}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 px-3 py-2 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  취소
                </button>
              </div>
            </>
          )}

          {faceRecognitionMessage && (
            <div
              className={`mt-1 rounded-xl px-3 py-2 text-[11px] border ${faceRecognitionMessage.includes('성공')
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-red-300 bg-red-50 text-red-700'
                }`}
            >
              {faceRecognitionMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FaceRecognitionLogin;