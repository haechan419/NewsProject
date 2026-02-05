// MyPage.jsx (FULL) — Sidebar + Right Slide Panel for "피드 카테고리 설정"
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import ScrapTab from "../../scrap/ScrapTab";
import "./MyPage.css";

import {
    FiHome,
    FiTarget,
    FiVideo,
    FiBookmark,
    FiTool,
    FiHelpCircle,
} from "react-icons/fi";

const MyPage = ({ memberId }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { pathname } = useLocation();

    // ✅ URL 기반 active (메인/관심사)
    const isHome = pathname === "/";
    const isInterests = pathname.startsWith("/settings/interests");

    // --- 상태 ---
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 콘텐츠 탭 (videos/scrap)
    const [activeTab, setActiveTab] = useState("videos");

    // ✅ 오른쪽 슬라이드 패널 (피드 카테고리 설정)
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    // modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rawText, setRawText] = useState("");
    const [customTitle, setCustomTitle] = useState("");
    const [videoMode, setVideoMode] = useState("9:16");

    // auth
    const { isAuthenticated } = useSelector((state) => state.auth || {});

    // URL ?tab=scrap 이면 스크랩 탭으로
    useEffect(() => {
        if (searchParams.get("tab") === "scrap") setActiveTab("scrap");
    }, [searchParams]);

    // 데이터 로드
    const fetchData = useCallback(async () => {
        if (!memberId || !isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get(
                `http://localhost:8080/api/ai/mypage/${memberId}`,
                { withCredentials: true }
            );
            setData(res.data);
            setError(null);
        } catch (err) {
            console.error("데이터 로드 에러:", err);
            setError(
                err.response?.data?.message || "서버에서 데이터를 불러오지 못했습니다."
            );
        } finally {
            setLoading(false);
        }
    }, [memberId, isAuthenticated]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 영상 제작 요청
    const handleCreateVideo = async () => {
        if (!rawText || !customTitle) {
            alert("제목과 본문을 입력해주세요!");
            return;
        }

        const requestData = {
            memberId: Number(memberId),
            rawText,
            customTitle,
            newsId: null,
            videoMode,
            isVipAuto: data?.isVip || false,
            isMainHot: false,
        };

        try {
            await axios.post("http://localhost:8080/api/ai/video/request", requestData, {
                withCredentials: true,
            });
            alert("영상 생성이 요청되었습니다! 파이썬 엔진이 작업을 시작합니다.");
            setIsModalOpen(false);
            setRawText("");
            setCustomTitle("");
            fetchData();
        } catch (err) {
            console.error("영상 요청 실패:", err);
            alert("요청 실패: " + (err.response?.data?.message || err.message));
        }
    };

    // 카테고리 데이터
    const categories = useMemo(
        () => [
            { id: "pol", label: "정치", icon: "⚖️", subs: ["국회", "정당", "행정"] },
            { id: "eco", label: "경제", icon: "💰", subs: ["금융", "부동산", "산업"] },
            { id: "ent", label: "엔터", icon: "🎬", subs: ["연예", "방송", "음악"] },
            { id: "it", label: "IT/과학", icon: "💻", subs: ["AI", "반도체", "IT기기"] },
            { id: "spo", label: "스포츠", icon: "⚽", subs: ["야구", "축구", "골프"] },
            { id: "int", label: "국제", icon: "🌐", subs: ["미국", "중국", "유럽"] },
        ],
        []
    );

    // ✅ ESC로 패널/모달 닫기
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsCategoryOpen(false);
                setIsModalOpen(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    if (loading) {
        return <div className="loading">AI 스튜디오 정보를 불러오는 중...</div>;
    }

    if (error || !data) {
        return (
            <div className="error-container">
                <h2>데이터를 불러올 수 없습니다</h2>
                <p>
                    {error ||
                        "서버 연결에 실패했습니다. 백엔드(8080) 실행 여부를 확인해주세요."}
                </p>
                <button onClick={fetchData} className="btn-black" style={{ marginTop: 16 }}>
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="studio-layout">
            {/* ===== Sidebar ===== */}
            <div className="sidebar-wrap">
            <aside className="studio-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-mark" />
                    <span className="brand-text">AI Studio</span>
                </div>

                <div className="menu-group">
                    <div
                        className={`menu-item ${isHome ? "active" : ""}`}
                        onClick={() => navigate("/")}
                    >
                        <FiHome className="menu-ico" />
                        <span>메인 피드</span>
                    </div>

                    <div
                        className={`menu-item ${isInterests ? "active" : ""}`}
                        onClick={() => navigate("/settings/interests")}
                    >
                        <FiTarget className="menu-ico" />
                        <span>관심사 맞춤 설정</span>
                    </div>
                </div>

                <div className="divider" />

                <div className="menu-title">
                    내 콘텐츠 <span className="arrow">&gt;</span>
                </div>

                <div
                    className={`menu-item ${activeTab === "videos" ? "active" : ""}`}
                    onClick={() => setActiveTab("videos")}
                >
                    <FiVideo className="menu-ico" />
                    <span>제작 영상 보관함</span>
                </div>

                <div
                    className={`menu-item ${activeTab === "scrap" ? "active" : ""}`}
                    onClick={() => setActiveTab("scrap")}
                >
                    <FiBookmark className="menu-ico" />
                    <span>스크랩한 뉴스</span>
                </div>

                {/* ✅ 피드 카테고리: 탭 변경이 아니라 오른쪽 패널로 열기 */}
                <div
                    className={`menu-item ${isCategoryOpen ? "active" : ""}`}
                    onClick={() => setIsCategoryOpen(true)}
                >
                    <FiTool className="menu-ico" />
                    <span>피드 카테고리 설정</span>
                </div>

                <div className="divider" />

                <div className="menu-item" onClick={() => navigate("/support")}>
                    <FiHelpCircle className="menu-ico" />
                    <span>고객 지원 센터</span>
                </div>
            </aside>
            </div>

            {/* ===== Main ===== */}
            <main className="studio-main">
                <div className="channel-banner">
                    <span>ShortNews AI Studio</span>
                    <button onClick={() => navigate(-1)} className="btn-white">
                        ← 이전으로
                    </button>
                </div>

                <div className="profile-header">
                    <div className="profile-img">👤</div>
                    <div className="profile-details">
                        <h1>
                            {memberId}번 회원님{" "}
                            {data.isVip && <span className="vip-badge">💎 VIP</span>}
                        </h1>
                        <p className="desc">관심 분야: {data.interestCategories || "설정 없음"}</p>

                        <div className="profile-actions">
                            <button className="btn-black" onClick={() => setIsModalOpen(true)}>
                                + 새 영상 제작
                            </button>
                        </div>
                    </div>
                </div>

                {/* 상단 탭 */}
                <div className="tabs">
                    <button
                        className={activeTab === "videos" ? "active" : ""}
                        onClick={() => setActiveTab("videos")}
                    >
                        동영상 ({data.myVideos?.length || 0})
                    </button>
                    <button
                        className={activeTab === "scrap" ? "active" : ""}
                        onClick={() => setActiveTab("scrap")}
                    >
                        스크랩 ({data.scrapItems?.length ?? data.scrapNewsIds?.length ?? 0})
                    </button>
                </div>

                {/* ===== Tab Contents ===== */}
                {activeTab === "scrap" && (
                    <ScrapTab
                        scrapItems={data.scrapItems ?? []}
                        memberId={memberId ? Number(memberId) : null}
                        onUnscrapSuccess={(item) => {
                            setData((prev) => ({
                                ...prev,
                                scrapItems: (prev.scrapItems ?? []).filter(
                                    (i) => i.sno !== item.sno && i.newsId !== item.newsId
                                ),
                            }));
                        }}
                    />
                )}

                {activeTab === "videos" && (
                    <div className="video-grid">
                        {data.myVideos?.map((video) => (
                            <div key={video.vno} className="video-card">
                                <div className="video-thumb">
                                    {video.status === "COMPLETED" ? (
                                        <video
                                            src={`http://localhost:8080/upload/videos/${video.videoUrl}`}
                                            muted
                                            loop
                                            onMouseEnter={(e) => {
                                                const el = e.currentTarget;
                                                const p = el.play();
                                                if (p) p.catch(() => {});
                                            }}
                                            onMouseLeave={(e) => {
                                                const el = e.currentTarget;
                                                el.pause();
                                                el.currentTime = 0;
                                            }}
                                        />
                                    ) : (
                                        <div className="processing-placeholder">
                      <span>
                        {video.status === "PROCESSING" ? "🎬 제작 중..." : "⏳ 대기 중"}
                      </span>
                                        </div>
                                    )}
                                    <span className="badge">{video.videoMode}</span>
                                </div>

                                <div className="video-info">
                                    <p className="video-title">{video.customTitle || "제목 없음"}</p>
                                    <p className="video-meta">
                                        {new Date(video.regDate).toLocaleDateString()} • {video.status}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {data.myVideos?.length === 0 && (
                            <p className="empty-state">
                                아직 생성된 영상이 없습니다. 첫 영상을 만들어보세요!
                            </p>
                        )}
                    </div>
                )}
            </main>

            {/* ===== Right Slide Panel: Category Settings ===== */}
            {isCategoryOpen && (
                <div
                    className="rightsheet-overlay"
                    onClick={() => setIsCategoryOpen(false)}
                >
                    <section
                        className="rightsheet"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <header className="rightsheet-header">
                            <div>
                                <h2 className="rightsheet-title">피드 카테고리 설정</h2>
                                <p className="rightsheet-desc">
                                    메인 페이지에 보여줄 카테고리를 선택하세요.
                                </p>
                            </div>

                            <button
                                className="rightsheet-close"
                                onClick={() => setIsCategoryOpen(false)}
                                aria-label="닫기"
                            >
                                ✕
                            </button>
                        </header>

                        <div className="rightsheet-body">
                            <div className="category-grid">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="category-box">
                                        <div className="main-cat">
                                            <input type="checkbox" id={`cat-${cat.id}`} defaultChecked />
                                            <label htmlFor={`cat-${cat.id}`}>
                                                {cat.icon} {cat.label}
                                            </label>
                                        </div>

                                        <div className="sub-cats">
                                            {cat.subs.map((sub) => (
                                                <span key={sub} className="tag">
                          #{sub}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <footer className="rightsheet-footer">
                            <button
                                className="save-btn"
                                onClick={() => {
                                    alert("설정이 저장되었습니다!");
                                    setIsCategoryOpen(false);
                                }}
                            >
                                설정 저장 및 메인 피드 반영
                            </button>
                        </footer>
                    </section>
                </div>
            )}

            {/* ===== Modal ===== */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>AI 뉴스 제작 요청</h2>

                        <div className="mode-selector">
                            <p className="selector-label">화면 비율 선택</p>
                            <div className="mode-buttons">
                                <button
                                    className={`mode-btn ${videoMode === "9:16" ? "active" : ""}`}
                                    onClick={() => setVideoMode("9:16")}
                                >
                                    📱 숏폼 (9:16)
                                </button>
                                <button
                                    className={`mode-btn ${videoMode === "16:9" ? "active" : ""}`}
                                    onClick={() => setVideoMode("16:9")}
                                >
                                    💻 일반 (16:9)
                                </button>
                            </div>
                        </div>

                        <input
                            type="text"
                            className="modal-input"
                            placeholder="영상 제목 (예: 오늘의 주요 뉴스)"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                        />

                        <textarea
                            className="modal-textarea"
                            placeholder="AI가 영상을 제작할 본문을 입력하세요..."
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                        />

                        <div className="modal-actions">
                            <button onClick={handleCreateVideo} className="submit-btn">
                                제작 시작
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="close-btn">
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPage;
