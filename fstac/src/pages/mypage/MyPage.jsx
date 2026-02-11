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
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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

  // 제작상태 자동갱신
  useEffect(() => {
    const hasActiveTask = data?.myVideos?.some(
      (v) => v.status === "PENDING" || v.status === "PROCESSING",
    );

    if (hasActiveTask) {
      const timer = setInterval(() => {
        fetchData();
      }, 5000); // 5초 주기
      return () => clearInterval(timer);
    }
  }, [data, fetchData]);

  // 영상 삭제 기능
  const handleDeleteVideo = async (vno, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (!window.confirm("정말 이 영상을 삭제하시겠습니까?")) return;

    // 이건 주석이야

    try {
      await axios.delete(`http://localhost:8080/api/ai/video/delete/${vno}`, {
        withCredentials: true,
      });
      alert("삭제되었습니다.");
      fetchData(); // 목록 새로고침
    } catch (err) {
      alert("삭제 실패");
    }
  };

  // ★ 추가: AI 글쓰기 연동 (수정본)
  const handleAiWriting = async () => {
    if (!customTitle.trim()) return alert("영상 제목을 먼저 입력해주세요!");

    setIsGenerating(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/api/ai/generate-article",
        { title: customTitle },
      );
      setRawText(res.data.content); // 생성된 글을 본문 영역에 자동 채움
    } catch (err) {
      console.error("AI 글쓰기 실패", err);
      alert("AI 글쓰기 엔진에 연결할 수 없습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVideoClick = (video) => {
    if (video.status === "COMPLETED" && video.videoUrl) {
      setSelectedVideo(video);
      setVideoError(false);
      setVideoLoading(true);
    } else {
      alert("영상 제작이 완료될 때까지 기다려주세요!");
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

  // 스크롤 이동 로직
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

  // 영상 제작 요청
  const handleCreateVideo = async () => {
    if (!rawText || !customTitle) return alert("제목과 내용을 입력해주세요!");

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
  if (!data)
    return <div className="loading">사용자 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="youtube-layout">
      {/* 사이드바 */}
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

        {/* 영상 그리드 */}
        <div className="video-grid">
          {data.myVideos?.length > 0 ? (
            data.myVideos.map((video) => (
              <div
                key={video.vno}
                className={`video-card ${video.status === "COMPLETED" ? "playable" : ""} ${selectedVideo?.vno === video.vno ? "playing" : ""}`}
                onClick={() => handleVideoClick(video)}
              >
                <div className="video-thumb">
                  {/* 삭제 버튼 추가 */}
                  <button
                    className="btn-delete-task"
                    onClick={(e) => handleDeleteVideo(video.vno, e)}
                  >
                    ×
                  </button>

                  {video.status === "COMPLETED" && video.videoUrl ? (
                    <video
                      src={`http://localhost:8080/upload/videos/${video.videoUrl}`}
                      muted
                      loop
                    />
                  ) : (
                    <div className={`processing-placeholder ${video.status}`}>
                      <div className="spinner"></div>
                      <span>{video.status}...</span>
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
            <div className="empty-state">
              <p>아직 제작된 영상이 없습니다.</p>
              <span>'새 영상 제작' 버튼을 눌러 AI 뉴스를 만들어보세요!</span>
            </div>
          )}
        </div>
      </div>

      {/* 제작 사이드 패널 */}
      {isModalOpen && (
        <div className="side-production-panel">
          <div className="panel-header">
            <h2>AI 뉴스 제작 요청</h2>
            <button
              className="panel-close"
              onClick={() => setIsModalOpen(false)}
            >
              &times;
            </button>
          </div>

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

          <div className="panel-input-group">
            <label className="panel-label">영상 제목</label>
            <div className="input-with-btn">
              <input
                type="text"
                className="modal-input"
                placeholder="제목을 입력하면 AI가 본문을 써줍니다"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
              <button
                className={`btn-ai-magic ${isGenerating ? "loading" : ""}`}
                onClick={handleAiWriting}
                disabled={isGenerating}
              >
                {isGenerating ? "✍️..." : "🪄 AI 작성"}
              </button>
            </div>
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
              onClick={handleCreateVideo}
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

      {/* 시네마틱 플레이어 모달 (생략 - 기존 로직 유지) */}
      {selectedVideo && (
        <div
          className="video-modal-overlay"
          onClick={() => setSelectedVideo(null)}
        >
          <button
            className="modal-close-x"
            onClick={() => setSelectedVideo(null)}
          >
            &times;
          </button>
          <div
            className="video-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-video-wrapper">
              {videoError ? (
                <div className="error-msg">영상을 로드할 수 없습니다.</div>
              ) : (
                <video
                  key={selectedVideo.vno}
                  src={`http://localhost:8080/upload/videos/${selectedVideo.videoUrl}`}
                  controls
                  autoPlay
                  className={
                    selectedVideo.videoMode === "9:16"
                      ? "portrait"
                      : "landscape"
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
