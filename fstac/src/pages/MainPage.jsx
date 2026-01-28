import React, { useState } from 'react';
import TopBar from '../layouts/TopBar';
import './MainPage.css';

const MainPage = () => {
  // 히어로 섹션 더미데이터
  const heroData = {
    subTitle: '오늘의 인기 영상',
    title: '이것은\n핫이슈\n영상자리',
    buttonText: '지금 보기'
  };

  // 대시보드 카드 더미데이터
  const dashboardCards = [
    {
      id: 1,
      title: '침대 독차지한 햄스터',
      views: '2.8만회',
      imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=400&h=200&fit=crop',
      description: '귀여운 햄스터의 일상'
    },
    {
      id: 2,
      title: '산책하는 강아지',
      views: '5.2만회',
      imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=200&fit=crop',
      description: '행복한 강아지의 산책'
    },
    {
      id: 3,
      title: '창문 너머 강아지',
      views: '3.6만회',
      imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
      description: '호기심 가득한 강아지'
    }
  ];

  // 뉴스 섹션 더미데이터
  const newsCategories = ['정치', '경제', 'IT', '연예'];
  const [selectedCategory, setSelectedCategory] = useState('정치');

  const newsData = {
    mainNews: {
      title: '푸데 푸데',
      subtitle: '저는 뉴스자리예요',
      description: '구름처럼 잠을 좀 자보도록 하겠습니다',
      views: '12.5만회'
    },
    sideNews: {
      title: '전에 알던\n문제가 아냐\nBrand New',
      badge: 'NEW'
    },
    categoryNews: {
      정치: [
        { id: 1, title: '국정감사 시작, 주요 이슈 집중', views: '8.2만회' },
        { id: 2, title: '정부 정책 발표 예정', views: '5.1만회' },
        { id: 3, title: '국회 본회의 개최', views: '3.9만회' }
      ],
      경제: [
        { id: 1, title: '주식시장 상승세 지속', views: '15.3만회' },
        { id: 2, title: '환율 변동성 증가', views: '9.7만회' },
        { id: 3, title: '부동산 시장 동향', views: '7.4만회' }
      ],
      IT: [
        { id: 1, title: '새로운 AI 기술 발표', views: '22.1만회' },
        { id: 2, title: '스마트폰 신제품 출시', views: '18.5만회' },
        { id: 3, title: '클라우드 서비스 업데이트', views: '11.2만회' }
      ],
      연예: [
        { id: 1, title: '인기 드라마 최종회 방영', views: '35.8만회' },
        { id: 2, title: '아이돌 그룹 컴백 소식', views: '28.4만회' },
        { id: 3, title: '영화 개봉 예정작 화제', views: '19.6만회' }
      ]
    }
  };

  return (
    <div className="main-page">
      <TopBar />

      {/* 1. 히어로 섹션 (강아지 배경) */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="sub-title">{heroData.subTitle}</p>
          <h1>{heroData.title.split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              {idx < heroData.title.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}</h1>
          <button className="cta-button">{heroData.buttonText}</button>
        </div>
      </section>

      {/* 2. 대시보드 섹션 (민트색 배경) */}
      <section className="dashboard-section">
        <div className="dashboard-header">
          <h2>인기 동영상</h2>
          <p>
            지금 가장 많이 본 영상을 확인해보세요<br/>
            매일 업데이트되는<br/>
            실시간 인기 콘텐츠를 만나보세요
          </p>
        </div>

        <div className="card-grid">
          {dashboardCards.map((card) => (
            <div key={card.id} className="card-item">
              <div 
                className="card-image-placeholder"
                style={{
                  backgroundImage: `url(${card.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <span className="overlay-text">
                  {card.title}<br/>조회수 {card.views}
                </span>
              </div>
              <div className="card-desc-box">{card.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. 하단 뉴스 섹션 */}
      <section className="news-section">
        <h2 className="section-title">오늘의 뉴스</h2>
        
        <div className="category-tabs">
          {newsCategories.map((category) => (
            <span 
              key={category}
              className={selectedCategory === category ? 'active' : ''}
              onClick={() => setSelectedCategory(category)}
              style={{ cursor: 'pointer' }}
            >
              {category}
            </span>
          ))}
        </div>
        <hr className="divider"/>

        <div className="news-content">
          {/* 왼쪽 큰 비디오 영역 */}
          <div className="news-large">
            <div className="video-placeholder">
              <p className="video-text">
                <span className="highlight">{newsData.mainNews.title}</span><br/>
                {newsData.mainNews.subtitle}<br/>
                <span className="sub">{newsData.mainNews.description}</span><br/>
                <span className="sub" style={{ marginTop: '10px', display: 'block' }}>
                  조회수 {newsData.mainNews.views}
                </span>
              </p>
            </div>
          </div>

          {/* 오른쪽 사이드 영역 */}
          <div className="news-side">
            <div className="side-card">
              <h3>{newsData.sideNews.title.split('\n').map((line, idx) => (
                <React.Fragment key={idx}>
                  {line}
                  {idx < newsData.sideNews.title.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}</h3>
              <div className="circle-badge">{newsData.sideNews.badge}</div>
            </div>
          </div>
        </div>

        {/* 카테고리별 뉴스 리스트 */}
        <div className="news-list">
          <h3 style={{ textAlign: 'left', marginBottom: '20px', fontSize: '20px' }}>
            {selectedCategory} 카테고리 인기 뉴스
          </h3>
          <div className="news-items">
            {newsData.categoryNews[selectedCategory].map((news) => (
              <div key={news.id} className="news-item">
                <div className="news-item-number">{news.id}</div>
                <div className="news-item-content">
                  <h4>{news.title}</h4>
                  <span className="news-views">조회수 {news.views}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MainPage;