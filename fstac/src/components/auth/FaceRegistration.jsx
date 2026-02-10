import { Button } from '@/components/ui/button';

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
    <div className="space-y-4">
      {/* 카메라/파일 선택 버튼 */}
      {!facePreview && !isCameraActive && (
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onCameraToggle}
            variant="outline"
            disabled={isRegisteringFace || isLoading}
            className="flex-1 bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 active:bg-blue-100 active:border-blue-500 transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            카메라로 촬영
          </Button>
          <label htmlFor="face-image" className="flex-1">
            <Button
              type="button"
              variant="outline"
              disabled={isRegisteringFace || isLoading}
              className="w-full bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 active:bg-blue-100 active:border-blue-500 transition-all duration-200"
              asChild
            >
              <span>
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                파일에서 선택
              </span>
            </Button>
            <input
              type="file"
              id="face-image"
              ref={fileInputRef}
              accept="image/*"
              onChange={onFaceImageSelect}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* 업로드 영역 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        {isCameraActive ? (
          <div className="space-y-4">
            <div className="relative">
              {!isVideoReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  <div className="text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                    <p>카메라를 준비하는 중...</p>
                  </div>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full max-w-sm mx-auto rounded-lg ${isVideoReady ? 'block' : 'hidden'}`}
                style={{
                  minHeight: '200px',
                  objectFit: 'cover',
                  backgroundColor: '#000'
                }}
              />
            </div>
            {cameraError ? (
              <div className="text-red-600">
                <p>{cameraError}</p>
                <Button
                  type="button"
                  onClick={onStopCamera}
                  variant="outline"
                  className="mt-4"
                >
                  닫기
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onCapturePhoto}
                  disabled={isRegisteringFace || isLoading || !isVideoReady}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isRegisteringFace ? '처리 중...' : '촬영하기'}
                </Button>
                <Button
                  type="button"
                  onClick={onStopCamera}
                  variant="outline"
                  disabled={isRegisteringFace || isLoading}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            )}
          </div>
        ) : facePreview ? (
          <div className="space-y-4">
            <img src={facePreview} alt="얼굴 미리보기" className="mx-auto max-w-full max-h-64 rounded-lg" />
            {isRegisteringFace ? (
              <div className="text-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p>얼굴을 등록하는 중...</p>
              </div>
            ) : (
              <>
                {faceMessage && faceMessage.includes('완료') ? (
                  <div className="text-green-600 font-semibold">
                    ✓ {faceMessage}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={onRegisterFace}
                      disabled={isRegisteringFace || isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      얼굴 등록
                    </Button>
                    <Button
                      type="button"
                      onClick={onResetFace}
                      variant="outline"
                      disabled={isRegisteringFace || isLoading}
                      className="flex-1"
                    >
                      초기화
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-700">카메라로 촬영하거나 파일을 선택해주세요</p>
            <p className="text-xs text-gray-500">(한 명의 얼굴이 명확하게 보이는 사진)</p>
          </div>
        )}
      </div>
      {faceMessage && !faceMessage.includes('완료') && (
        <div className={`p-3 rounded-lg text-sm ${faceMessage.includes('실패') || faceMessage.includes('오류')
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
          {faceMessage}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">
        얼굴 인식을 위해 한 명의 얼굴이 명확하게 보이는 사진을 업로드해주세요. (최대 10MB)
      </p>
      {facePreview && !isRegisteringFace && !faceMessage?.includes('완료') && (
        <Button
          type="button"
          onClick={onResetFace}
          variant="outline"
          className="w-full mt-4"
          disabled={isRegisteringFace || isLoading}
        >
          취소
        </Button>
      )}
    </div>
  );
};

export default FaceRegistration;
