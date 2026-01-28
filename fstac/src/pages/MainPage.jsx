import React from 'react';
import TopBar from '../components/layout/TopBar';
import './MainPage.css';

const MainPage = () => {
  return (
    <div className="main-page">
      <TopBar />

      {/* 1. 히어로 섹션 (강아지 배경) */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="sub-title">서브타이틀</p>
          <h1>이것은<br/>핫이슈<br/>영상자리</h1>
          <button className="cta-button"></button>
        </div>
        {/* 실제 배경 이미지는 CSS에서 설정하거나 img 태그를 absolute로 넣어야 합니다 */}
      </section>

      {/* 2. 대시보드 섹션 (민트색 배경) */}
      <section className="dashboard-section">
        <div className="dashboard-header">
          <h2>어느걸 적어야할지 고민중인 메인대쉬보드</h2>
          <p>
            여기아래께 뭐라고 열심히 적긴한 레퍼런스디자인<br/>
            대략적으로<br/>
            3줄정도 되는 것 같습니다
          </p>
        </div>

        <div className="card-grid">
          {/* 카드 1 */}
          <div className="card-item">
            <div className="card-image-placeholder">
               {/* 햄스터 이미지 자리 */}
               <span className="overlay-text">침대 독차지한 햄스터<br/>조회수 2.8만회</span>
            </div>
            <div className="card-desc-box">제목</div>
          </div>
          {/* 카드 2 */}
          <div className="card-item">
            <div className="card-image-placeholder">
                {/* 강아지 이미지 자리 */}
            </div>
            <div className="card-desc-box"></div>
          </div>
          {/* 카드 3 */}
          <div className="card-item">
             <div className="card-image-placeholder">
                {/* 창문 강아지 이미지 자리 */}
             </div>
             <div className="card-desc-box"></div>
          </div>
        </div>
      </section>

      {/* 3. 하단 뉴스 섹션 */}
      <section className="news-section">
        <h2 className="section-title">여기는 제목자리예요 (아마도 cat)</h2>
        
        <div className="category-tabs">
            <span>정치</span>
            <span>경제</span>
            <span>it</span>
            <span>연예</span>
        </div>
        <hr className="divider"/>

        <div className="news-content">
            {/* 왼쪽 큰 비디오 영역 */}
            <div className="news-large">
                <div className="video-placeholder">
                    <p className="video-text">
                        <span className="highlight">푸데 푸데</span><br/>
                        저는 뉴스자리예요<br/>
                        <span className="sub">구름처럼 잠을 좀 자보도록 하겠습니다</span>
                    </p>
                </div>
            </div>

            {/* 오른쪽 사이드 영역 */}
            <div className="news-side">
                <div className="side-card">
                    <h3>전에 알던<br/>문제가 아냐<br/>Brand New</h3>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default MainPage;