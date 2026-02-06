import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserInfoAsync } from "@/slices/authSlice";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineFilm,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineCog,
  HiOutlineQuestionMarkCircle,
  HiOutlineOfficeBuilding,
  HiOutlineCurrencyDollar,
  HiOutlineMusicNote,
  HiOutlineChip,
  HiOutlineUserGroup,
  HiOutlineGlobe,
} from "react-icons/hi";
import ScrapTab from "@/scrap/ScrapTab";
import { getMyCategories, updateCategories } from "@/api/authApi";
import { convertCategoriesToDisplayNames, convertDisplayNamesToCategories } from "@/api/categoryApi";
import "./MyPage.css";

const FEED_CATEGORIES = [
  { name: "정치", Icon: HiOutlineOfficeBuilding, color: "#e3f2fd" },
  { name: "경제", Icon: HiOutlineCurrencyDollar, color: "#e8f5e9" },
  { name: "문화", Icon: HiOutlineMusicNote, color: "#f3e5f5" },
  { name: "IT/과학", Icon: HiOutlineChip, color: "#e1f5fe" },
  { name: "사회", Icon: HiOutlineUserGroup, color: "#fff3e0" },
  { name: "국제", Icon: HiOutlineGlobe, color: "#e0f7fa" },
];
const MAX_CATEGORIES = 3;

const MyPage = ({ memberId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [videoMode, setVideoMode] = useState("9:16");
  const [activeTab, setActiveTab] = useState("videos");
  const [mainView, setMainView] = useState("feed"); // "feed" | "category"
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  // 피드 카테고리 설정
  const [categoryList, setCategoryList] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);

  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});
  const displayName = user?.nickname || user?.name || (memberId ? `${memberId}번 회원` : "회원");

  // URL ?tab=scrap 반영
  useEffect(() => {
    if (tabParam === "scrap") {
      setActiveTab("scrap");
      setMainView("feed");
    }
  }, [tabParam]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === "scrap" ? { tab: "scrap" } : {});
  };

  // 피드 카테고리 설정 로드 (프로필 수정과 동일 API)
  const loadCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);
      const raw = await getMyCategories();
      const names = convertCategoriesToDisplayNames(Array.isArray(raw) ? raw : []);
      setCategoryList(names);
    } catch (err) {
      console.error("카테고리 조회 실패:", err);
      setCategoryList([]);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mainView === "category") loadCategories();
  }, [mainView, loadCategories]);

  const handleCategoryToggle = (name) => {
    const isSelected = categoryList.includes(name);
    if (isSelected) {
      setCategoryList((prev) => prev.filter((c) => c !== name));
    } else if (categoryList.length < MAX_CATEGORIES) {
      setCategoryList((prev) => [...prev, name]);
    }
  };
  const isCategorySelected = (name) => categoryList.includes(name);
  const isCategoryDisabled = (name) => !isCategorySelected(name) && categoryList.length >= MAX_CATEGORIES;

  const handleCategorySave = async () => {
    try {
      setCategorySaving(true);
      const english = convertDisplayNamesToCategories(categoryList);
      await updateCategories(english);
      await dispatch(fetchUserInfoAsync());
      alert("피드 카테고리가 저장되었습니다.");
    } catch (err) {
      console.error("카테고리 저장 실패:", err);
      alert("저장에 실패했습니다.");
    } finally {
      setCategorySaving(false);
    }
  };

  /** 스크랩 해제 시 목록에서만 제거 (전체 새로고침 없음) */
  const handleUnscrapSuccess = useCallback((item) => {
    setData((prev) => {
      if (!prev?.scrapItems) return prev;
      return {
        ...prev,
        scrapItems: prev.scrapItems.filter(
          (s) => String(s.newsId) !== String(item.newsId)
        ),
      };
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!memberId || !isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:8080/api/ai/mypage/${memberId}`,
        { withCredentials: true },
      );
      setData(res.data);
      setError(null);
    } catch (err) {
      setError("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [memberId, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 카테고리 등 다른 화면에서 스크랩 추가 후 마이페이지로 돌아왔을 때 목록 갱신
  useEffect(() => {
    if (location.pathname === "/mypage" && memberId && isAuthenticated) {
      fetchData();
    }
  }, [location.pathname, memberId, isAuthenticated, fetchData]);

  const handleVideoClick = (video) => {
    if (video.status === "COMPLETED" && video.videoUrl) {
      setIsModalOpen(false);
      setSelectedVideo(video);
      setVideoError(false);
      setVideoLoading(true);
    } else {
      if (video.status === "COMPLETED" && !video.videoUrl) {
        alert("영상 파일을 찾을 수 없습니다. 관리자에게 문의해주세요.");
      }
    }
  };

  const playableVideos =
    data?.myVideos?.filter((v) => v.status === "COMPLETED") || [];
  const handlePrevVideo = useCallback(() => {
    const idx = playableVideos.findIndex((v) => v.vno === selectedVideo?.vno);
    if (idx > 0) setSelectedVideo(playableVideos[idx - 1]);
  }, [selectedVideo, playableVideos]);

  const handleNextVideo = useCallback(() => {
    const idx = playableVideos.findIndex((v) => v.vno === selectedVideo?.vno);
    if (idx < playableVideos.length - 1)
      setSelectedVideo(playableVideos[idx + 1]);
  }, [selectedVideo, playableVideos]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (isScrolling || !selectedVideo) return;
      setIsScrolling(true);
      if (e.deltaY > 0) handleNextVideo();
      else handlePrevVideo();
      setTimeout(() => setIsScrolling(false), 800);
    };
    if (selectedVideo)
      window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [selectedVideo, isScrolling, handlePrevVideo, handleNextVideo]);

  const handleCreateVideo = async () => {
    if (!rawText || !customTitle) {
      alert("내용을 입력해주세요!");
      return;
    }
    try {
      await axios.post(
        "http://localhost:8080/api/ai/video/request",
        {
          memberId: Number(memberId),
          rawText,
          customTitle,
          videoMode,
          isVipAuto: data?.isVip || false,
          isMainHot: false,
        },
        { withCredentials: true },
      );
      alert("제작이 시작되었습니다!");
      setIsModalOpen(false);
      setRawText("");
      setCustomTitle("");
      fetchData();
    } catch (err) {
      alert("요청 실패");
    }
  };

  if (loading) return <div className="mypage-loading">마이페이지 로딩 중...</div>;
  if (error) return <div className="mypage-error">{error}</div>;

  return (
    <div className="mypage-layout">
      {/* 왼쪽 카테고리 선택 바 */}
      <aside className="mypage-sidebar">
        <div className="mypage-sidebar-brand">AI Studio</div>
        <nav className="mypage-sidebar-nav">
          <button
            type="button"
            className="mypage-sidebar-item"
            onClick={() => navigate("/")}
          >
            <HiOutlineHome className="mypage-sidebar-icon" />
            <span>메인 피드</span>
          </button>
          <div className="mypage-sidebar-label">내 콘텐츠</div>
          <button
            type="button"
            className={`mypage-sidebar-item ${mainView === "feed" && activeTab === "videos" ? "active" : ""}`}
            onClick={() => { setMainView("feed"); setActiveTab("videos"); setSearchParams({}); }}
          >
            <HiOutlineFilm className="mypage-sidebar-icon" />
            <span>제작 영상 보관함</span>
          </button>
          <button
            type="button"
            className={`mypage-sidebar-item ${mainView === "feed" && activeTab === "scrap" ? "active" : ""}`}
            onClick={() => { setMainView("feed"); setActiveTab("scrap"); setSearchParams({ tab: "scrap" }); }}
          >
            <HiOutlineBookmark className="mypage-sidebar-icon" />
            <span>스크랩한 뉴스</span>
          </button>
          <button
            type="button"
            className={`mypage-sidebar-item ${mainView === "category" ? "active" : ""}`}
            onClick={() => setMainView("category")}
          >
            <HiOutlineCog className="mypage-sidebar-icon" />
            <span>피드 카테고리 설정</span>
          </button>
          <div className="mypage-sidebar-label">지원</div>
          <button
            type="button"
            className="mypage-sidebar-item"
            onClick={() => navigate("/support")}
          >
            <HiOutlineQuestionMarkCircle className="mypage-sidebar-icon" />
            <span>고객 지원 센터</span>
          </button>
        </nav>
      </aside>

      {/* 메인 영역 */}
      <div className="mypage-main">
        {mainView === "category" ? (
          /* 피드 카테고리 설정 화면 */
          <div className="mypage-category-wrap">
            <div className="mypage-category-panel">
              <header className="mypage-category-header">
                <h2 className="mypage-category-title">피드 카테고리 설정</h2>
                <p className="mypage-category-desc">
                  카테고리를 선택하고 관심 뉴스를 받아보세요. 최대 3개까지 선택할 수 있습니다.
                </p>
              </header>
              {categoryLoading ? (
                <div className="mypage-category-loading">불러오는 중...</div>
              ) : (
                <div className="mypage-category-body">
                  <ul className="mypage-category-list">
                    {FEED_CATEGORIES.map(({ name, Icon, color }) => {
                      const selected = isCategorySelected(name);
                      const disabled = isCategoryDisabled(name);
                      return (
                        <li key={name}>
                          <button
                            type="button"
                            className={`mypage-category-row ${selected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
                            onClick={() => handleCategoryToggle(name)}
                            disabled={disabled}
                          >
                            <span className="mypage-category-row-icon" style={{ backgroundColor: color }}>
                              <Icon className="mypage-category-row-icon-svg" />
                            </span>
                            <span className="mypage-category-row-name">{name}</span>
                            <span className="mypage-category-row-bookmark" aria-hidden="true">
                              {selected ? <HiBookmark /> : <HiOutlineBookmark />}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mypage-category-count-text">
                    <span className="mypage-category-count-num">{categoryList.length}</span> / {MAX_CATEGORIES}개 선택
                  </p>
                  <button
                    type="button"
                    className="mypage-category-done"
                    onClick={handleCategorySave}
                    disabled={categorySaving}
                  >
                    {categorySaving ? "저장 중..." : "완료"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* 상단 배너 영역 */}
            <section className="mypage-welcome">
              <div className="mypage-container">
                <h2 className="mypage-welcome-title">NewsPulse AI Studio</h2>
                <p className="mypage-welcome-desc">AI 뉴스 영상 제작 및 스크랩 기사 관리</p>
              </div>
            </section>

            {/* 프로필 정보 영역 */}
            <div className="mypage-container">
              <section className="mypage-profile">
                <div className="mypage-profile-avatar" aria-hidden="true">
                  <span className="mypage-profile-initial">M</span>
                </div>
                <div className="mypage-profile-details">
                  <h1 className="mypage-profile-name">
                    {displayName}님
                    {data?.isVip && <span className="vip-badge">VIP</span>}
                  </h1>
                </div>
                <button
                  type="button"
                  className="mypage-btn primary mypage-profile-create"
                  onClick={() => setIsModalOpen(true)}
                >
                  새 영상 제작
                </button>
              </section>
            </div>

            {/* 하위 탭: 영상 목록 | 스크랩 */}
            <div className="mypage-tabs-wrap">
              <nav className="mypage-tabs">
                <button
                  type="button"
                  className={`mypage-tab ${activeTab === "videos" ? "active" : ""}`}
                  onClick={() => switchTab("videos")}
                >
                  영상 목록
                </button>
                <button
                  type="button"
                  className={`mypage-tab ${activeTab === "scrap" ? "active" : ""}`}
                  onClick={() => switchTab("scrap")}
                >
                  스크랩
                </button>
              </nav>
            </div>

            {/* 탭별 콘텐츠 */}
            <section className="mypage-content">
        {activeTab === "videos" && (
          <>
            <div className="mypage-content-header">
              <span className="mypage-content-title">제작한 영상</span>
            </div>
            <div className="video-grid">
              {data?.myVideos?.length ? (
                data.myVideos.map((video) => (
                  <div
                    key={video.vno}
                    className={`video-card ${video.status === "COMPLETED" ? "playable" : ""}`}
                    onClick={() => handleVideoClick(video)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleVideoClick(video);
                    }}
                  >
                    <div className="video-thumb">
                      {video.status === "COMPLETED" && video.videoUrl ? (
                        <video
                          src={`http://localhost:8080/upload/videos/${video.videoUrl}`}
                          muted
                          loop
                          onError={() => {}}
                        />
                      ) : (
                        <div className={`processing-placeholder ${video.status}`}>
                          <span>{video.status}</span>
                        </div>
                      )}
                      <span className="badge">{video.videoMode}</span>
                    </div>
                    <div className="video-info">
                      <p className="video-title">
                        {video.customTitle || "제목 없음"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="mypage-empty">
                  <p>제작한 영상이 없습니다.</p>
                  <button
                    type="button"
                    className="mypage-btn primary"
                    onClick={() => setIsModalOpen(true)}
                  >
                    영상 제작
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "scrap" && (
          <ScrapTab
            scrapItems={data?.scrapItems || []}
            memberId={memberId}
            onUnscrapSuccess={handleUnscrapSuccess}
          />
        )}
      </section>
          </>
        )}
      </div>

      {/* 제작 사이드 패널 */}
      {isModalOpen && (
        <div className="side-production-panel">
          <h2>AI 뉴스 제작 요청</h2>
          <div className="panel-input-group">
            <label className="panel-label">화면 비율</label>
            <div className="mode-tab-group">
              <button
                type="button"
                className={`mode-tab ${videoMode === "9:16" ? "active" : ""}`}
                onClick={() => setVideoMode("9:16")}
              >
                숏폼 (9:16)
              </button>
              <button
                type="button"
                className={`mode-tab ${videoMode === "16:9" ? "active" : ""}`}
                onClick={() => setVideoMode("16:9")}
              >
                일반 (16:9)
              </button>
            </div>
          </div>
          <div className="panel-input-group">
            <label className="panel-label">영상 제목</label>
            <input
              type="text"
              className="modal-input"
              placeholder="영상의 핵심 제목을 입력하세요"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>
          <div className="panel-input-group flex-grow">
            <label className="panel-label">기사 본문 내용</label>
            <textarea
              className="modal-textarea"
              placeholder="AI가 분석할 기사 본문을 여기에 붙여넣으세요..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>
          <div className="panel-footer-btns">
            <button
              type="button"
              onClick={() => {
                if (!customTitle.trim() || !rawText.trim()) {
                  alert("제목과 내용을 모두 입력해주세요!");
                  return;
                }
                handleCreateVideo();
              }}
              className="btn-start-production"
            >
              제작 시작
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-cancel-production"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 영상 재생 모달 */}
      {selectedVideo && (
        <div
          className="video-modal-overlay"
          onClick={() => setSelectedVideo(null)}
          role="presentation"
        >
          <button
            type="button"
            className="modal-close-x"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVideo(null);
            }}
            aria-label="닫기"
          >
            &times;
          </button>
          <div
            className="video-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <div className="modal-video-wrapper">
              {videoError ? (
                <div className="video-modal-error">
                  <p>영상을 불러올 수 없습니다.</p>
                  <p className="video-modal-error-url">{selectedVideo.videoUrl}</p>
                  <button
                    type="button"
                    className="mypage-btn primary"
                    onClick={() => {
                      setVideoError(false);
                      setVideoLoading(true);
                    }}
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <>
                  {videoLoading && (
                    <div className="video-modal-loading">영상 로딩 중...</div>
                  )}
                  <video
                    key={selectedVideo.vno}
                    src={`http://localhost:8080/upload/videos/${selectedVideo.videoUrl}`}
                    controls
                    autoPlay
                    className={
                      selectedVideo.videoMode === "9:16" ? "portrait" : "landscape"
                    }
                    onEnded={handleNextVideo}
                    onError={() => {
                      setVideoError(true);
                      setVideoLoading(false);
                    }}
                    onLoadedData={() => {
                      setVideoLoading(false);
                      setVideoError(false);
                    }}
                    onLoadStart={() => {
                      setVideoLoading(true);
                      setVideoError(false);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
