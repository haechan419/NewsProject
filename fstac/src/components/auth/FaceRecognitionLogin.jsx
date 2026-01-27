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
    <div className="divider-container">
      <div className="divider">
        <div className="divider-line"></div>
        <span className="divider-text">또는</span>
        <div className="divider-line"></div>
      </div>
      
      {!isCameraActive ? (
        <button 
          type="button" 
          onClick={onCameraToggle}
          disabled={isLoading || isRecognizing}
          className="face-login-button"
        >
          <span>📷 얼굴 인식 로그인</span>
        </button>
      ) : (
        <div className="camera-container">
          <div className="camera-video-wrapper">
            {!isVideoReady && !cameraError && (
              <div className="camera-loading">
                <div className="camera-loading-spinner"></div>
                <p>카메라를 준비하는 중...</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            {!cameraError && isVideoReady && (
              <div className="camera-overlay">
                <div className="face-outline-container">
                  <svg viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg" className="face-outline-svg">
                    <ellipse cx="100" cy="120" rx="70" ry="90" fill="none" stroke="rgba(102, 126, 234, 0.8)" strokeWidth="3" strokeDasharray="5,5"/>
                    <ellipse cx="80" cy="100" rx="8" ry="6" fill="none" stroke="rgba(102, 126, 234, 0.6)" strokeWidth="2"/>
                    <ellipse cx="120" cy="100" rx="8" ry="6" fill="none" stroke="rgba(102, 126, 234, 0.6)" strokeWidth="2"/>
                    <ellipse cx="100" cy="125" rx="5" ry="8" fill="none" stroke="rgba(102, 126, 234, 0.6)" strokeWidth="2"/>
                    <ellipse cx="100" cy="150" rx="15" ry="8" fill="none" stroke="rgba(102, 126, 234, 0.6)" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="face-guide-text">
                  얼굴을 프레임 안에 맞춰주세요
                </div>
              </div>
            )}
          </div>
          
          {cameraError ? (
            <div className="camera-error">
              {cameraError}
              <button
                type="button"
                onClick={onStopCamera}
                className="camera-error-close-button"
              >
                닫기
              </button>
            </div>
          ) : (
            <>
              {/* 자동 인식 토글 */}
              <div className="auto-recognition-toggle">
                <span className="auto-recognition-label">
                  자동 얼굴 인식 (10초마다)
                </span>
                <button
                  type="button"
                  onClick={onAutoRecognitionToggle}
                  className={`auto-recognition-button ${!autoRecognitionEnabled ? 'off' : ''}`}
                >
                  {autoRecognitionEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              
              <div className="face-recognition-buttons">
                <button
                  type="button"
                  onClick={onFaceRecognition}
                  disabled={!isVideoReady || isRecognizing || isLoading}
                  className="face-recognition-button"
                >
                  {isRecognizing ? '인식 중...' : '수동 인식'}
                </button>
                <button
                  type="button"
                  onClick={onStopCamera}
                  disabled={isRecognizing || isLoading}
                  className="face-recognition-button face-recognition-button-cancel"
                >
                  취소
                </button>
              </div>
            </>
          )}
          
          {faceRecognitionMessage && (
            <div className={`face-recognition-message ${faceRecognitionMessage.includes('성공') ? 'success' : 'error'}`}>
              {faceRecognitionMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FaceRecognitionLogin;
