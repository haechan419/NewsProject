import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./MyPage.css";

const MyPage = ({ memberId }) => {
  const navigate = useNavigate();
  // --- 상태 관리 ---
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rawText, setRawText] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [videoMode, setVideoMode] = useState("9:16");
  const [activeTab, setActiveTab] = useState("videos");

  // 1. Redux에서 인증 상태 가져오기
  // 토큰은 쿠키에 있으므로 isAuthenticated로 로그인 여부만 판단합니다.
  const { isAuthenticated } = useSelector((state) => state.auth || {});

  // 2. 데이터 로드 함수 (GET)
  const fetchData = useCallback(async () => {
    // memberId가 없거나 로그인이 안 되어 있으면 중단
    if (!memberId || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // withCredentials: true 설정을 통해 브라우저의 accessToken 쿠키를 함께 보냅니다.
      const res = await axios.get(
        `http://localhost:8080/api/ai/mypage/${memberId}`,
        { withCredentials: true },
      );
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error("데이터 로드 에러:", err);
      // 백엔드에서 보낸 에러 메시지(ERROR_ACCESS_TOKEN 등)가 있으면 출력
      setError(
        err.response?.data?.message || "서버에서 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [memberId, isAuthenticated]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. 영상 제작 요청 함수 (POST)
  const handleCreateVideo = async () => {
    if (!rawText || !customTitle) {
      alert("제목과 본문을 입력해주세요!");
      return;
    }

    const requestData = {
      memberId: Number(memberId),
      rawText: rawText,
      customTitle: customTitle,
      newsId: null,
      videoMode: videoMode,
      isVipAuto: data?.isVip || false,
      isMainHot: false,
    };

    try {
      // POST 요청 시에도 반드시 쿠키(신분증)를 포함해야 합니다.
      await axios.post(
        "http://localhost:8080/api/ai/video/request",
        requestData,
        { withCredentials: true },
      );
      alert("영상 생성이 요청되었습니다! 파이썬 엔진이 작업을 시작합니다.");
      setIsModalOpen(false);
      setRawText("");
      setCustomTitle("");
      fetchData(); // 제작 요청 후 목록 새로고침
    } catch (err) {
      console.error("영상 요청 실패:", err);
      alert("요청 실패: " + (err.response?.data?.message || err.message));
    }
  };

  // --- 조건부 렌더링 ---

  if (loading)
    return <div className="loading">AI 스튜디오 정보를 불러오는 중...</div>;

  if (error || !data) {
    return (
      <div
        className="error-container"
        style={{ padding: "50px", textAlign: "center" }}
      >
        <h2>데이터를 불러올 수 없습니다</h2>
        <p>
          {error ||
            "서버 연결에 실패했습니다. 백엔드(8080) 실행 여부를 확인해주세요."}
        </p>
        <button
          onClick={fetchData}
          className="btn-black"
          style={{ marginTop: "20px" }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="youtube-layout">
      {/* 사이드바 영역 */}
      <div className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🎬</span>
          <span className="brand-text">AI Studio</span>
        </div>

        {/* 그룹 1: 바로가기 (메인 연동) */}
        <div className="menu-group">
          <p className="menu-label">바로가기</p>
          <div className="menu-item home" onClick={() => navigate("/")}>
            <span className="icon">🏠</span> <span>메인 피드</span>
          </div>
          {/* ★ '이전으로' 대신 추천 뉴스 설정 추가 */}
          <div
            className="menu-item"
            onClick={() => navigate("/settings/interests")}
          >
            <span className="icon">🎯</span> <span>관심사 맞춤 설정</span>
          </div>
        </div>

        {/* 내 활동 관리 그룹 수정 */}
        <div className="menu-group">
          <p className="menu-label">내 콘텐츠</p>
          <div
            className={`menu-item ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => setActiveTab("videos")}
          >
            <span className="icon">📹</span> <span>제작 영상 보관함</span>
          </div>
          <div
            className={`menu-item ${activeTab === "scrap" ? "active" : ""}`}
            onClick={() => setActiveTab("scrap")}
          >
            <span className="icon">🔖</span> <span>스크랩한 뉴스</span>
          </div>

          {/* ★ AI 활동 리포트 대신 '관심 카테고리 설정' 추가 */}
          <div
            className={`menu-item ${activeTab === "category" ? "active" : ""}`}
            onClick={() => setActiveTab("category")}
          >
            <span className="icon">🛠️</span> <span>피드 카테고리 설정</span>
          </div>
        </div>

        {/* 그룹 3: 고객 지원 */}
        <div className="menu-group">
          <p className="menu-label">지원</p>
          <div className="menu-item" onClick={() => navigate("/support")}>
            <span className="icon">❓</span> <span>고객지원 센터</span>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div
          className="channel-banner"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>ShortNews AI Studio</span>
          <button
            onClick={() => navigate(-1)}
            className="btn-white"
            style={{
              fontSize: "14px",
              padding: "5px 15px",
              borderRadius: "20px",
              border: "1px solid white",
              background: "transparent",
              color: "white",
              cursor: "pointer",
            }}
          >
            ← 이전으로
          </button>
        </div>

        {/* 프로필 섹션 */}
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
            <div className="profile-actions" style={{ marginTop: "15px" }}>
              <button
                className="btn-black"
                onClick={() => setIsModalOpen(true)}
              >
                + 새 영상 제작
              </button>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
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
            스크랩 ({data.scrapNewsIds?.length || 0})
          </button>
        </div>

        {/* 영상 그리드 (호버 재생) */}
        <div className="video-grid">
          {activeTab === "videos" &&
            data.myVideos?.map((video) => (
              <div key={video.vno} className="video-card">
                <div className="video-thumb">
                  {video.status === "COMPLETED" ? (
                    <video
                      src={`http://localhost:8080/upload/videos/${video.videoUrl}`}
                      width="100%"
                      muted
                      loop
                      onMouseEnter={(e) => {
                        // play()는 비동기(Promise)로 작동하므로 에러 처리를 해주어야 합니다.
                        const playPromise = e.target.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(() => {
                            // 재생이 중단되더라도 콘솔에 빨간 에러를 남기지 않습니다.
                          });
                        }
                      }}
                      onMouseLeave={(e) => {
                        // 마우스가 떠나면 즉시 멈추고 처음으로 되돌립니다.
                        e.target.pause();
                        e.target.currentTime = 0;
                      }}
                    />
                  ) : (
                    <div className="processing-placeholder">
                      <span>
                        {video.status === "PROCESSING"
                          ? "🎬 제작 중..."
                          : "⏳ 대기 중"}
                      </span>
                    </div>
                  )}
                  <span className="badge">{video.videoMode}</span>
                </div>
                <div className="video-info">
                  <p className="video-title">
                    {video.customTitle || "제목 없음"}
                  </p>
                  <p className="video-meta">
                    {new Date(video.regDate).toLocaleDateString()} •{" "}
                    {video.status}
                  </p>
                </div>
              </div>
            ))}
          {activeTab === "videos" && data.myVideos?.length === 0 && (
            <p
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "40px",
                color: "#606060",
              }}
            >
              아직 생성된 영상이 없습니다. 첫 영상을 만들어보세요!
            </p>
          )}
        </div>
      </div>

      {/* ★ 이 부분에 카테고리 설정 UI를 추가합니다 */}
      {activeTab === "category" && (
        <div className="category-settings-container">
          <div className="settings-header">
            <h2 className="settings-title">🎯 개인 맞춤 뉴스 피드 설정</h2>
            <p className="settings-desc">
              메인 페이지 상단 메뉴 중 보고 싶은 카테고리만 선택하세요.
            </p>
          </div>

          <div className="category-grid">
            {/* 캡2321처.jpg에 나온 메뉴들을 기준으로 구성 */}
            {[
              {
                id: "pol",
                label: "정치",
                icon: "⚖️",
                subs: ["국회", "정당", "행정"],
              },
              {
                id: "eco",
                label: "경제",
                icon: "💰",
                subs: ["금융", "부동산", "산업"],
              },
              {
                id: "ent",
                label: "엔터",
                icon: "🎬",
                subs: ["연예", "방송", "음악"],
              },
              {
                id: "it",
                label: "IT/과학",
                icon: "💻",
                subs: ["AI", "반도체", "IT기기"],
              },
              {
                id: "spo",
                label: "스포츠",
                icon: "⚽",
                subs: ["야구", "축구", "골프"],
              },
              {
                id: "int",
                label: "국제",
                icon: "🌐",
                subs: ["미국", "중국", "유럽"],
              },
            ].map((cat) => (
              <div
                key={cat.id}
                className={`category-box ${cat.id === "it" ? "highlight" : ""}`}
              >
                <div className="main-cat">
                  <input type="checkbox" id={cat.id} defaultChecked />
                  <label htmlFor={cat.id}>
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

          <div className="settings-actions">
            <button
              className="save-btn"
              onClick={() => alert("설정이 저장되었습니다!")}
            >
              설정 저장 및 메인 피드 반영
            </button>
          </div>
        </div>
      )}

      {/* 영상 제작 모달 */}
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
              <button
                onClick={() => setIsModalOpen(false)}
                className="close-btn"
              >
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
