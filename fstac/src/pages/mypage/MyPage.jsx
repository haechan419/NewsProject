import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./MyPage.css";

const MyPage = ({ memberId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [videoMode, setVideoMode] = useState("9:16");
  const [activeTab, setActiveTab] = useState("videos");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const { isAuthenticated } = useSelector((state) => state.auth || {});

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

  // [수정] 영상 클릭 시 사이드바 자동 닫힘 로직
  const handleVideoClick = (video) => {
    if (video.status === "COMPLETED") {
      setIsModalOpen(false);
      setSelectedVideo(video);
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

  if (loading) return <div className="loading">AI 스튜디오 로딩 중...</div>;

  return (
    <div className="youtube-layout">
      {/* 사이드바: 기획안 구성 */}
      <div className="sidebar">
        <div className="sidebar-brand">🎬 AI Studio</div>
        <div className="menu-group">
          <p className="menu-label">바로가기</p>
          <div className="menu-item" onClick={() => navigate("/")}>
            🏠 메인 피드
          </div>
          <div
            className="menu-item"
            onClick={() => navigate("/settings/interests")}
          >
            🎯 관심사 맞춤 설정
          </div>
        </div>
        <div className="menu-group">
          <p className="menu-label">내 콘텐츠</p>
          <div
            className={`menu-item ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => setActiveTab("videos")}
          >
            📹 제작 영상 보관함
          </div>
          <div className="menu-item">🔖 스크랩한 뉴스</div>
          <div className="menu-item">🛠️ 피드 카테고리 설정</div>
        </div>
        <div className="menu-group">
          <p className="menu-label">지원</p>
          <div className="menu-item">❓ 고객지원 센터</div>
        </div>
      </div>

      <div className="main-content">
        <div className="channel-banner-mini">ShortNews AI Studio</div>
        <div className="profile-header">
          <div className="profile-img">👤</div>
          <div className="profile-details">
            <h1>
              {memberId}번 회원님{" "}
              {data.isVip && <span className="vip-badge">💎 VIP</span>}
            </h1>
            <p className="desc">
              관심 분야: {data.interestCategories || "설정 없음"}
            </p>
            <button
              className="btn-create-pill"
              onClick={() => setIsModalOpen(true)}
            >
              + 새 영상 제작
            </button>
          </div>
        </div>

        <div className="video-grid">
          {data.myVideos?.map((video) => (
            <div
              key={video.vno}
              className={`video-card ${video.status === "COMPLETED" ? "playable" : ""}`}
              onClick={() => handleVideoClick(video)}
            >
              <div className="video-thumb">
                {video.status === "COMPLETED" ? (
                  <video
                    src={`http://localhost:8080/upload/videos/${video.videoUrl}`}
                    muted
                    loop
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
          ))}
        </div>
      </div>

      {/* 제작 사이드 패널 */}
      {isModalOpen && (
        <div className="side-production-panel">
          <h2>AI 뉴스 제작 요청</h2>

          {/* 1. 화면 비율 선택 */}
          <div className="panel-input-group">
            <label className="panel-label">화면 비율</label>
            <div className="mode-tab-group">
              <button
                className={`mode-tab ${videoMode === "9:16" ? "active" : ""}`}
                onClick={() => setVideoMode("9:16")}
              >
                📱 숏폼 (9:16)
              </button>
              <button
                className={`mode-tab ${videoMode === "16:9" ? "active" : ""}`}
                onClick={() => setVideoMode("16:9")}
              >
                💻 일반 (16:9)
              </button>
            </div>
          </div>

          {/* 2. 영상 제목 입력 (누락되었던 부분 복구) */}
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

          {/* 3. 기사 본문 내용 */}
          <div className="panel-input-group flex-grow">
            <label className="panel-label">기사 본문 내용</label>
            <textarea
              className="modal-textarea"
              placeholder="AI가 분석할 기사 본문을 여기에 붙여넣으세요..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
          </div>

          {/* 4. 하단 버튼 (디자인 분리) */}
          <div className="panel-footer-btns">
            <button
              onClick={() => {
                if (!customTitle.trim() || !rawText.trim()) {
                  alert("제목과 내용을 모두 입력해주세요!"); // 에러 메시지 구체화
                  return;
                }
                handleCreateVideo();
              }}
              className="btn-start-production"
            >
              제작 시작
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="btn-cancel-production"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 시네마틱 모달 */}
      {selectedVideo && (
        <div
          className="video-modal-overlay"
          onClick={() => setSelectedVideo(null)}
        >
          <button
            className="modal-close-x"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedVideo(null);
            }}
          >
            &times;
          </button>
          <div
            className="video-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-video-wrapper">
              <video
                key={selectedVideo.vno}
                src={`http://localhost:8080/upload/videos/${selectedVideo.videoUrl}`}
                controls
                autoPlay
                className={
                  selectedVideo.videoMode === "9:16" ? "portrait" : "landscape"
                }
                onEnded={handleNextVideo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
