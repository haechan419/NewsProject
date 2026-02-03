import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MainPage = () => {
  // 캐러셀 상태
  const [currentSlide, setCurrentSlide] = useState(0); 

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
      title: '물음표에서 시작된 빛 \n 스스로 만든 느낌표가 되다',
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

  // 총 슬라이드 개수
  const totalSlides = carouselData.length;

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

      {/* 메인 배너/캐러셀 */}
      <section className="bg-gray-800 text-white py-12 px-4 md:px-8 h-[1100px] relative flex items-start">
        <div className="max-w-7xl mx-auto w-full pt-20 mt-[300px]">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm text-gray-300">그룹소개</span>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="relative">
            <h1 className="text-3xl md:text-5xl font-bold mb-8 leading-tight whitespace-pre-line">
              {carouselData[currentSlide].title}
            </h1>

            {/* 캐러셀 네비게이션 */}
            <div className="flex items-center gap-4 mt-[60px]">
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
    </div>
  );
};

export default MainPage;
