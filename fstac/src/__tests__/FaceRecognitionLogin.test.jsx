import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FaceRecognitionLogin from '../components/auth/FaceRecognitionLogin';

// Mock video element
const mockVideoRef = {
    current: {
        readyState: 4, // HAVE_ENOUGH_DATA
        videoWidth: 640,
        videoHeight: 480,
        srcObject: null,
    },
};

describe('얼굴 인식 로그인 컴포넌트', () => {
    const defaultProps = {
        isCameraActive: false,
        isVideoReady: false,
        cameraError: '',
        isRecognizing: false,
        isLoading: false,
        faceRecognitionMessage: '',
        autoRecognitionEnabled: true,
        videoRef: mockVideoRef,
        onCameraToggle: vi.fn(),
        onFaceRecognition: vi.fn(),
        onStopCamera: vi.fn(),
        onAutoRecognitionToggle: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('카메라 비활성화 상태', () => {
        it('얼굴 인식 시작 버튼이 표시되어야 함', () => {
            render(<FaceRecognitionLogin {...defaultProps} />);

            expect(screen.getByText(/얼굴 인식으로 로그인/i)).toBeInTheDocument();
            expect(screen.getByText(/카메라를 켜서 등록된 얼굴로 자동 로그인합니다/i)).toBeInTheDocument();
        });

        it('버튼 클릭 시 카메라 활성화 함수가 호출되어야 함', () => {
            const onCameraToggle = vi.fn();
            render(<FaceRecognitionLogin {...defaultProps} onCameraToggle={onCameraToggle} />);

            const button = screen.getByText(/얼굴 인식으로 로그인/i).closest('button');
            fireEvent.click(button);

            expect(onCameraToggle).toHaveBeenCalledTimes(1);
        });

        it('로딩 중일 때 버튼이 비활성화되어야 함', () => {
            render(<FaceRecognitionLogin {...defaultProps} isLoading={true} />);

            const button = screen.getByText(/얼굴 인식으로 로그인/i).closest('button');
            expect(button).toBeDisabled();
        });
    });

    describe('카메라 활성화 상태', () => {
        const activeCameraProps = {
            ...defaultProps,
            isCameraActive: true,
            isVideoReady: false,
        };

        it('비디오 엘리먼트가 렌더링되어야 함', () => {
            render(<FaceRecognitionLogin {...activeCameraProps} />);

            const video = document.querySelector('video');
            expect(video).toBeInTheDocument();
        });

        it('카메라 준비 중일 때 로딩 메시지가 표시되어야 함', () => {
            render(<FaceRecognitionLogin {...activeCameraProps} />);

            expect(screen.getByText(/카메라를 준비하는 중/i)).toBeInTheDocument();
        });

        it('자동 인식 토글 버튼이 표시되어야 함', () => {
            render(<FaceRecognitionLogin {...activeCameraProps} isVideoReady={true} />);

            expect(screen.getByText(/자동 얼굴 인식/i)).toBeInTheDocument();
        });

        it('수동 인식 버튼과 취소 버튼이 표시되어야 함', () => {
            render(<FaceRecognitionLogin {...activeCameraProps} isVideoReady={true} />);

            expect(screen.getByText(/수동 인식/i)).toBeInTheDocument();
            expect(screen.getByText(/취소/i)).toBeInTheDocument();
        });
    });

    describe('자동 얼굴 인식 토글', () => {
        it('자동 인식 ON 상태가 표시되어야 함', () => {
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                    autoRecognitionEnabled={true}
                />
            );

            expect(screen.getByText('ON')).toBeInTheDocument();
        });

        it('자동 인식 OFF 상태가 표시되어야 함', () => {
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                    autoRecognitionEnabled={false}
                />
            );

            expect(screen.getByText('OFF')).toBeInTheDocument();
        });

        it('토글 버튼 클릭 시 핸들러가 호출되어야 함', () => {
            const onAutoRecognitionToggle = vi.fn();
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                    onAutoRecognitionToggle={onAutoRecognitionToggle}
                />
            );

            const toggleButton = screen.getByRole('button', { name: /자동 얼굴 인식/i });
            fireEvent.click(toggleButton);

            expect(onAutoRecognitionToggle).toHaveBeenCalledTimes(1);
        });
    });

    describe('수동 얼굴 인식', () => {
        it('수동 인식 버튼 클릭 시 핸들러가 호출되어야 함', () => {
            const onFaceRecognition = vi.fn();
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                    onFaceRecognition={onFaceRecognition}
                />
            );

            const button = screen.getByText(/수동 인식/i);
            fireEvent.click(button);

            expect(onFaceRecognition).toHaveBeenCalledTimes(1);
        });

        it('인식 중일 때 "인식 중..." 텍스트가 표시되어야 함', () => {
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                    isRecognizing={true}
                />
            );

            expect(screen.getByText(/인식 중.../i)).toBeInTheDocument();
        });

        it('비디오가 준비되지 않았을 때 버튼이 비활성화되어야 함', () => {
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={false}
                />
            );

            const button = screen.getByText(/수동 인식/i);
            expect(button).toBeDisabled();
        });
    });

    describe('카메라 취소', () => {
        it('취소 버튼 클릭 시 카메라 종료 핸들러가 호출되어야 함', () => {
            const onStopCamera = vi.fn();
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                    onStopCamera={onStopCamera}
                />
            );

            const cancelButton = screen.getByText(/취소/i);
            fireEvent.click(cancelButton);

            expect(onStopCamera).toHaveBeenCalledTimes(1);
        });
    });

    describe('에러 처리', () => {
        it('카메라 에러 메시지가 표시되어야 함', () => {
            const errorMessage = '카메라 권한이 거부되었습니다';
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    cameraError={errorMessage}
                />
            );

            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });

        it('에러 발생 시 닫기 버튼이 표시되어야 함', () => {
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    cameraError="에러 발생"
                />
            );

            expect(screen.getByText(/닫기/i)).toBeInTheDocument();
        });
    });

    describe('얼굴 인식 결과 메시지', () => {
        it('성공 메시지가 초록색으로 표시되어야 함', () => {
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                    faceRecognitionMessage="얼굴 인식 성공!"
                />
            );

            const message = screen.getByText(/얼굴 인식 성공!/i);
            expect(message).toBeInTheDocument();
            expect(message.closest('div')).toHaveClass('border-emerald-300');
        });

        it('실패 메시지가 빨간색으로 표시되어야 함', () => {
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                    faceRecognitionMessage="얼굴 인식 실패"
                />
            );

            const message = screen.getByText(/얼굴 인식 실패/i);
            expect(message).toBeInTheDocument();
            expect(message.closest('div')).toHaveClass('border-red-300');
        });
    });

    describe('접근성', () => {
        it('비활성화 상태의 버튼이 올바르게 처리되어야 함', () => {
            render(<FaceRecognitionLogin {...defaultProps} isLoading={true} />);

            const button = screen.getByRole('button');
            expect(button).toHaveAttribute('disabled');
        });

        it('카메라 활성화 시 모든 컨트롤 버튼이 접근 가능해야 함', () => {
            render(
                <FaceRecognitionLogin
                    {...defaultProps}
                    isCameraActive={true}
                    isVideoReady={true}
                />
            );

            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });
});
