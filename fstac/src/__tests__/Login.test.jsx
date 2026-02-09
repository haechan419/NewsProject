import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import Login from '../pages/auth/Login';

// Mock API
vi.mock('../api/authApi', () => ({
    faceLogin: vi.fn(),
}));

vi.mock('../api/faceApi', () => ({
    recognizeFace: vi.fn(),
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
        getUserMedia: mockGetUserMedia,
    },
    writable: true,
});

// 테스트용 Redux 스토어 생성 함수
const createTestStore = (initialState = {}) => {
    return configureStore({
        reducer: {
            auth: authReducer,
        },
        preloadedState: {
            auth: {
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
                ...initialState.auth,
            },
        },
    });
};

// 렌더링 헬퍼 함수
const renderWithProviders = (
    ui,
    {
        initialState = {},
        store = createTestStore(initialState),
        ...renderOptions
    } = {}
) => {
    const Wrapper = ({ children }) => (
        <Provider store={store}>
            <BrowserRouter>{children}</BrowserRouter>
        </Provider>
    );

    return {
        store,
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    };
};

describe('로그인 컴포넌트', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 카메라 Mock 초기화
        mockGetUserMedia.mockResolvedValue({
            getTracks: () => [{ stop: vi.fn() }],
        });
    });

    describe('UI 렌더링', () => {
        it('로그인 폼이 정상적으로 렌더링되어야 함', () => {
            renderWithProviders(<Login />);

            // 이메일 입력 필드 확인
            expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();

            // 비밀번호 입력 필드 확인
            expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();

            // 로그인 버튼 확인
            expect(screen.getByRole('button', { name: /로그인/i })).toBeInTheDocument();
        });

        it('소셜 로그인 버튼들이 표시되어야 함', () => {
            renderWithProviders(<Login />);

            // 카카오, 네이버, 구글 로그인 버튼 확인
            expect(screen.getByText(/카카오/i)).toBeInTheDocument();
            expect(screen.getByText(/네이버/i)).toBeInTheDocument();
            expect(screen.getByText(/구글/i)).toBeInTheDocument();
        });

        it('얼굴 인식 로그인 버튼이 표시되어야 함', () => {
            renderWithProviders(<Login />);

            expect(screen.getByText(/얼굴 인식으로 로그인/i)).toBeInTheDocument();
        });
    });

    describe('이메일/비밀번호 로그인', () => {
        it('이메일과 비밀번호를 입력할 수 있어야 함', () => {
            renderWithProviders(<Login />);

            const emailInput = screen.getByLabelText(/이메일/i);
            const passwordInput = screen.getByLabelText(/비밀번호/i);

            fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });

            expect(emailInput.value).toBe('test@test.com');
            expect(passwordInput.value).toBe('password123');
        });

        it('유효하지 않은 이메일 형식일 때 에러 메시지가 표시되어야 함', async () => {
            renderWithProviders(<Login />);

            const emailInput = screen.getByLabelText(/이메일/i);
            const submitButton = screen.getByRole('button', { name: /로그인/i });

            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/올바른 이메일 형식이 아닙니다/i)).toBeInTheDocument();
            });
        });

        it('비밀번호가 비어있을 때 에러 메시지가 표시되어야 함', async () => {
            renderWithProviders(<Login />);

            const emailInput = screen.getByLabelText(/이메일/i);
            const submitButton = screen.getByRole('button', { name: /로그인/i });

            fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/비밀번호를 입력해주세요/i)).toBeInTheDocument();
            });
        });
    });

    describe('얼굴 인식 로그인', () => {
        it('얼굴 인식 버튼을 클릭하면 카메라가 활성화되어야 함', async () => {
            renderWithProviders(<Login />);

            const faceLoginButton = screen.getByText(/얼굴 인식으로 로그인/i);
            fireEvent.click(faceLoginButton);

            await waitFor(() => {
                expect(mockGetUserMedia).toHaveBeenCalledWith(
                    expect.objectContaining({
                        video: expect.any(Object),
                        audio: false,
                    })
                );
            });
        });

        it('카메라 활성화 시 비디오 엘리먼트가 표시되어야 함', async () => {
            renderWithProviders(<Login />);

            const faceLoginButton = screen.getByText(/얼굴 인식으로 로그인/i);
            fireEvent.click(faceLoginButton);

            await waitFor(() => {
                const video = document.querySelector('video');
                expect(video).toBeInTheDocument();
            });
        });

        it('자동 얼굴 인식 토글이 작동해야 함', async () => {
            renderWithProviders(<Login />);

            const faceLoginButton = screen.getByText(/얼굴 인식으로 로그인/i);
            fireEvent.click(faceLoginButton);

            await waitFor(() => {
                const toggleButton = screen.getByRole('button', { name: /자동 얼굴 인식/i });
                expect(toggleButton).toBeInTheDocument();
            });
        });

        it('카메라 권한이 거부되면 에러 메시지가 표시되어야 함', async () => {
            mockGetUserMedia.mockRejectedValueOnce({ name: 'NotAllowedError' });

            renderWithProviders(<Login />);

            const faceLoginButton = screen.getByText(/얼굴 인식으로 로그인/i);
            fireEvent.click(faceLoginButton);

            await waitFor(() => {
                expect(screen.getByText(/카메라 권한이 거부되었습니다/i)).toBeInTheDocument();
            });
        });
    });

    describe('로딩 상태', () => {
        it('로그인 중일 때 로딩 인디케이터가 표시되어야 함', () => {
            renderWithProviders(<Login />, {
                initialState: {
                    auth: {
                        isLoading: true,
                        isAuthenticated: false,
                        user: null,
                        error: null,
                    },
                },
            });

            const loginButton = screen.getByRole('button', { name: /로그인/i });
            expect(loginButton).toBeDisabled();
        });
    });

    describe('에러 처리', () => {
        it('로그인 에러가 있을 때 에러 메시지가 표시되어야 함', () => {
            const errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다';

            renderWithProviders(<Login />, {
                initialState: {
                    auth: {
                        isLoading: false,
                        isAuthenticated: false,
                        user: null,
                        error: errorMessage,
                    },
                },
            });

            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    describe('OAuth 로그인', () => {
        it('카카오 로그인 버튼을 클릭하면 OAuth 페이지로 이동해야 함', () => {
            // window.location.href를 mock
            delete window.location;
            window.location = { href: vi.fn() };

            renderWithProviders(<Login />);

            const kakaoButton = screen.getByText(/카카오/i).closest('button');
            fireEvent.click(kakaoButton);

            // OAuth URL로 리다이렉트 확인
            expect(window.location.href).toContain('oauth2/authorization/kakao');
        });
    });
});
