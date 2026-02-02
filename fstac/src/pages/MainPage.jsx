import React, { useState } from 'react';
import TopBar from '../layouts/TopBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MainPage = () => {
  // 캐러셀 상태
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  // 새로운 소식 탭 상태
  const [newsTab, setNewsTab] = useState('전체');

  // 보도자료 탭 상태
  const [pressTab, setPressTab] = useState('전체');

  // 새로운 소식 페이지네이션
  const [newsPage, setNewsPage] = useState(1);
  const totalNewsPages = 2;

  // 캐러셀 데이터
  const carouselData = [
    {
      title: '물음표에서 시작된 빛 스스로 만든 느낌표가 되다',
      id: 1
    },
    {
      title: '두 번째 슬라이드 제목',
      id: 2
    },
    {
      title: '세 번째 슬라이드 제목',
      id: 3
    }
  ];

  // 새로운 소식 데이터
  const newsData = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=400&h=200&fit=crop',
      title: '2026 군사력 랭킹 나왔다 \'NO 핵\' 한국 세계 5위',
      subtitle: '[영상] 핵무기 없는 한국 \'군사력 파워\' 3년 연속 세계 5위…북한 31위',
      duration: '02:47'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=200&fit=crop',
      title: '숨진 주인 옆에서 4일 인도가 울었다',
      subtitle: '[영상] 눈보라에 갇혀 숨진 주인...나흘 동안 곁 지킨 반려견',
      duration: '01:48'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
      title: '마트주차장에 \'시민 어벤져스\' 119보다 빨랐다!',
      subtitle: '[영상] "차 밑에 사람이 깔렸어요"...여기저기서 우르르 달려와 \'번쩍\'',
      duration: '02:02'
    }
  ];

  // 보도자료 데이터
  const pressReleases = [
    { id: 1, title: '처인구 신규 사업 발표', time: '2시간 전', duration: '00:50', thumbnail: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=100&h=100&fit=crop' },
    { id: 2, title: '기흥구 문화 행사 개최', time: '3시간 전', duration: '02:27', thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop' },
    { id: 3, title: '수지구 도로 공사 완료', time: '4시간 전', duration: '03:06', thumbnail: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop' },
    { id: 4, title: '처인구 환경 정책 발표', time: '5시간 전', duration: '02:04', thumbnail: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=100&h=100&fit=crop' },
    { id: 5, title: '기흥구 주민 참여 프로그램', time: '6시간 전', duration: '01:30', thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop' },
    { id: 6, title: '수지구 복지 서비스 확대', time: '7시간 전', duration: '02:15', thumbnail: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop' },
    { id: 7, title: '처인구 교통 개선 계획', time: '8시간 전', duration: '01:45', thumbnail: 'https://images.unsplash.com/photo-1517849845537-4d58f0e71329?w=100&h=100&fit=crop' },
    { id: 8, title: '기흥구 스마트시티 구축', time: '9시간 전', duration: '03:20', thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop' },
    { id: 9, title: '수지구 교육 시설 개선', time: '10시간 전', duration: '02:50', thumbnail: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop' }
  ];

  // 경제 데이터
  const economicData = {
    chosun: { value: '936.13', change: '-6.47' },
    yuan: { value: '205.81', change: '-1.62' },
    kospi: { value: '5,170.81', change: '+85.96' },
    kosdaq: { value: '1,133.52', change: '+50.93' },
    kospi200: { value: '758.72', change: '+13.59' },
    dollar: { value: '2026.01.28 장마감', change: '' }
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const handlePrevNewsPage = () => {
    setNewsPage((prev) => (prev === 1 ? totalNewsPages : prev - 1));
  };

  const handleNextNewsPage = () => {
    setNewsPage((prev) => (prev === totalNewsPages ? 1 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar />

      {/* 메인 배너/캐러셀 */}
      <section className="bg-gray-800 text-white py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-300">그룹소개</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="relative">
            <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight">
              {carouselData[currentSlide].title}
            </h1>

            {/* 캐러셀 네비게이션 */}
            <div className="flex items-center gap-4">
              <span className={`text-lg ${currentSlide === 0 ? 'font-bold' : 'text-gray-400'}`}>
                {String(currentSlide + 1).padStart(2, '0')}
              </span>
              <div className="h-px w-8 bg-gray-600"></div>
              <span className={`text-lg ${currentSlide === 2 ? 'font-bold' : 'text-gray-400'}`}>
                {String(totalSlides).padStart(2, '0')}
              </span>
              <button
                onClick={handlePrevSlide}
                className="ml-4 p-2 hover:bg-gray-700 rounded transition-colors"
                aria-label="이전 슬라이드"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextSlide}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                aria-label="다음 슬라이드"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 새로운 소식 섹션 */}
      <section className="bg-gray-100 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">새로운 소식</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{newsPage}/{totalNewsPages}</span>
              <button
                onClick={handlePrevNewsPage}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="이전 페이지"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextNewsPage}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                aria-label="다음 페이지"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-4 mb-6">
            {['전체', '처인구', '기흥구', '수지구'].map((tab) => (
              <button
                key={tab}
                onClick={() => setNewsTab(tab)}
                className={`px-4 py-2 rounded transition-colors ${newsTab === tab
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 뉴스 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {newsData.map((news) => (
              <Card key={news.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    연합뉴스
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {news.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{news.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{news.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 경제 데이터 */}
      <section className="bg-white border-y border-gray-200 py-4 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="font-semibold text-gray-900">조선경제 &gt;</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{economicData.chosun.value}</span>
              <span className="text-red-600">{economicData.chosun.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">위안(CNY)</span>
              <span className="text-gray-900">{economicData.yuan.value}</span>
              <span className="text-red-600">{economicData.yuan.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">코스피</span>
              <span className="text-gray-900">{economicData.kospi.value}</span>
              <span className="text-green-600">{economicData.kospi.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">코스닥</span>
              <span className="text-gray-900">{economicData.kosdaq.value}</span>
              <span className="text-green-600">{economicData.kosdaq.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">코스피200</span>
              <span className="text-gray-900">{economicData.kospi200.value}</span>
              <span className="text-green-600">{economicData.kospi200.change}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">달러</span>
              <span className="text-gray-900">{economicData.dollar.value}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 보도자료 및 사이드바 섹션 */}
      <section className="bg-gray-100 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 보도자료 섹션 (왼쪽 2/3) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">보도자료</h2>
              <div className="flex gap-2">
                {['전체', '처인구', '다'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPressTab(tab)}
                    className={`px-4 py-2 rounded transition-colors ${pressTab === tab
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 보도자료 리스트 (3열 그리드) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pressReleases.map((release) => (
                <div
                  key={release.id}
                  className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{release.title}</h3>
                      <p className="text-xs text-gray-500">{release.time}</p>
                    </div>
                    <div className="relative shrink-0">
                      <img
                        src={release.thumbnail}
                        alt={release.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                        {release.duration}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 사이드바 (오른쪽 1/3) */}
          <div className="lg:col-span-1">
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">새로운 소식</h3>
                <p className="text-sm text-gray-600 mb-6">
                  구독서비스에 대한 설명입니다
                </p>
                <Button className="w-full">버튼</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 채널 링크 */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            {['유튜브 채널', '연합뉴스', 'K-Culture NOW', '통동테크', '더건강', 'KOREA NOW', 'NK NOW', 'K-VIBE'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link}
              </a>
            ))}
          </div>

          {/* 연합뉴스 정보 */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold text-gray-900">연합뉴스</div>
              <div className="text-xs text-gray-600">
                주소: 서울특별시 중구 세종대로 124 | 전화: 02-398-3000 | 등록번호: 서울 아 00001 | 사업자등록번호: 000-00-00000 |{' '}
                <a href="#" className="text-blue-600 hover:underline">개인정보처리방침</a>
              </div>
            </div>

            {/* 소셜 미디어 및 패밀리 사이트 */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition-colors" aria-label="YouTube">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Family site</span>
                <button className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                  <span>+</span>
                </button>
              </div>
            </div>
          </div>

          {/* 저작권 */}
          <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
            ©2026 Yonhapnews Agency
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainPage;
