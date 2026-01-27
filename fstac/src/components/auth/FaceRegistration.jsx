const FaceRegistration = ({
  isCameraActive,
  isVideoReady,
  cameraError,
  isRegisteringFace,
  isLoading,
  facePreview,
  faceMessage,
  videoRef,
  fileInputRef,
  onCameraToggle,
  onFaceImageSelect,
  onCapturePhoto,
  onStopCamera,
  onRegisterFace,
  onResetFace
}) => {
  return (
    <div className="form-group face-register-section">
      <label htmlFor="face-image">얼굴 등록</label>
      
      {/* 카메라/파일 선택 버튼 */}
      {!facePreview && (
        <div className="face-upload-options">
          <button
            type="button"
            onClick={onCameraToggle}
            className="camera-button"
            disabled={isRegisteringFace || isLoading}
          >
            {isCameraActive ? '📷 카메라 끄기' : '📷 카메라로 촬영'}
          </button>
          <label htmlFor="face-image" className="file-upload-button">
            📁 파일에서 선택
            <input
              type="file"
              id="face-image"
              ref={fileInputRef}
              accept="image/*"
              onChange={onFaceImageSelect}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      <div className="face-upload-area">
        {isCameraActive ? (
          <div className="camera-container">
            <div className="camera-video-wrapper">
              {!isVideoReady && !cameraError && (
                <div className="camera-loading">
                  <div className="loading-spinner"></div>
                  <p>카메라를 준비하는 중...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`camera-video ${isVideoReady ? 'video-ready' : 'video-loading'}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  minHeight: '400px',
                  objectFit: 'cover',
                  backgroundColor: '#000'
                }}
              />
              {!cameraError && isVideoReady && (
                <div className="camera-overlay">
                  <div className="face-guide-frame">
                    <svg className="face-guide-svg" viewBox="0 0 200 250" xmlns="http://www.w3.org/2000/svg">
                      {/* 얼굴 윤곽 (타원) */}
                      <ellipse cx="100" cy="120" rx="70" ry="90" fill="none" stroke="rgba(102, 126, 234, 0.8)" strokeWidth="3" strokeDasharray="5,5"/>
                      {/* 왼쪽 눈 */}
                      <ellipse cx="80" cy="100" rx="8" ry="6" fill="none" stroke="rgba(102, 126, 234, 0.6)" strokeWidth="2"/>
                      {/* 오른쪽 눈 */}
                      <ellipse cx="120" cy="100" rx="8" ry="6" fill="none" stroke="rgba(102, 126, 234, 0.6)" strokeWidth="2"/>
                      {/* 코 */}
                      <ellipse cx="100" cy="125" rx="5" ry="8" fill="none" stroke="rgba(102, 126, 234, 0.6)" strokeWidth="2"/>
                      {/* 입 */}
                      <ellipse cx="100" cy="150" rx="15" ry="8" fill="none" stroke="rgba(102, 126, 234, 0.6)" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="camera-guide">얼굴을 프레임 안에 맞춰주세요</div>
                </div>
              )}
            </div>
            {cameraError ? (
              <div className="face-message error">
                {cameraError}
                <button
                  type="button"
                  onClick={onStopCamera}
                  className="cancel-camera-button"
                  style={{ marginTop: '12px', width: '100%' }}
                >
                  닫기
                </button>
              </div>
            ) : (
              <div className="camera-controls">
                <button
                  type="button"
                  onClick={onCapturePhoto}
                  className="capture-button"
                  disabled={isRegisteringFace || isLoading}
                >
                  {isRegisteringFace ? '⏳ 처리 중...' : '📸 촬영하기'}
                </button>
                <button
                  type="button"
                  onClick={onStopCamera}
                  className="cancel-camera-button"
                  disabled={isRegisteringFace || isLoading}
                >
                  취소
                </button>
              </div>
            )}
          </div>
        ) : facePreview ? (
          <div className="face-preview-container">
            <img src={facePreview} alt="얼굴 미리보기" className="face-preview-image" />
            {isRegisteringFace ? (
              <div className="face-preview-actions">
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  color: '#666'
                }}>
                  <div className="loading-spinner" style={{ margin: '0 auto 10px' }}></div>
                  <p>얼굴을 등록하는 중...</p>
                </div>
              </div>
            ) : (
              <div className="face-preview-actions">
                {faceMessage && faceMessage.includes('완료') ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px',
                    color: '#28a745',
                    fontWeight: 'bold'
                  }}>
                    ✓ {faceMessage}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onRegisterFace}
                      className="register-face-button"
                      disabled={isRegisteringFace || isLoading}
                    >
                      얼굴 등록
                    </button>
                    <button
                      type="button"
                      onClick={onResetFace}
                      className="reset-face-button"
                      disabled={isRegisteringFace || isLoading}
                    >
                      초기화
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="face-upload-placeholder">
            <div className="face-upload-icon">📷</div>
            <div className="face-upload-text">
              카메라로 촬영하거나 파일을 선택해주세요
              <br />
              <small style={{ color: '#999', fontSize: '12px' }}>
                (한 명의 얼굴이 명확하게 보이는 사진)
              </small>
            </div>
          </div>
        )}
      </div>
      {faceMessage && (
        <div className={`face-message ${faceMessage.includes('완료') ? 'success' : 'error'}`}>
          {faceMessage}
        </div>
      )}
      <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
        얼굴 인식을 위해 한 명의 얼굴이 명확하게 보이는 사진을 업로드해주세요. (최대 10MB)
      </small>
    </div>
  );
};

export default FaceRegistration;
