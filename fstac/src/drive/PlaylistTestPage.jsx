/**
 * 플레이리스트 컴포넌트 테스트 페이지
 * 개발 중 컴포넌트 확인용
 */
import { useState } from "react";
import { PlaylistSelection } from "./components/PlaylistSelection";
import { PlaylistPlayback } from "./components/PlaylistPlayback";

// Mock 플레이리스트 데이터
const mockPlaylists = [
  {
    id: "interest",
    title: "오늘의 관심 뉴스",
    description: "관심 카테고리 뉴스를 모았습니다",
    expectedCount: 5,
  },
  {
    id: "latest",
    title: "오늘의 주요 뉴스",
    description: "오늘 가장 중요한 뉴스를 모았습니다",
    expectedCount: 5,
  },
  {
    id: "economy",
    title: "경제·비즈니스 뉴스",
    description: "경제와 비즈니스 관련 뉴스를 모았습니다",
    expectedCount: 5,
  },
  {
    id: "politics_society",
    title: "정치·사회 뉴스",
    description: "정치와 사회 관련 뉴스를 모았습니다",
    expectedCount: 5,
  },
  {
    id: "it",
    title: "IT·과학 뉴스",
    description: "IT와 과학 관련 뉴스를 모았습니다",
    expectedCount: 5,
  },
  {
    id: "hot",
    title: "긴급 속보",
    description: "지금 가장 중요한 긴급 뉴스를 모았습니다",
    expectedCount: 3,
  },
];

// Mock 뉴스 데이터
const mockNewsList = [
  { newsId: "1", title: "경제 성장률 전망 상향 조정", category: "economy" },
  { newsId: "2", title: "IT 기업 실적 발표", category: "it" },
  { newsId: "3", title: "정치 개혁 논의 시작", category: "politics" },
  { newsId: "4", title: "사회 복지 정책 확대", category: "society" },
  { newsId: "5", title: "글로벌 시장 동향 분석", category: "world" },
];

export function PlaylistTestPage() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // 5분

  const handlePlaylistSelect = (playlist) => {
    console.log("플레이리스트 선택:", playlist);
    setSelectedPlaylist(playlist);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (newTime) => {
    setCurrentTime(newTime);
  };

  if (selectedPlaylist) {
    return (
      <PlaylistPlayback
        playlistTitle={selectedPlaylist.title}
        playlistImage={`/drive/images/playlists/${selectedPlaylist.id}.jpg`}
        newsList={mockNewsList}
        audioUrl=""
        onPlayPause={handlePlayPause}
        onClose={() => setSelectedPlaylist(null)}
        onHistoryOpen={() => console.log("히스토리 열기")}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onSeek={handleSeek}
      />
    );
  }

  return (
    <PlaylistSelection
      playlists={mockPlaylists}
      onSelect={handlePlaylistSelect}
      isLoading={false}
    />
  );
}
