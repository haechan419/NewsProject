import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi } from '../../api/boardApi';

function BoardPage() {
  const navigate = useNavigate();
  
  // 상태 관리
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tempSearchKeyword, setTempSearchKeyword] = useState('');
  const [boardType, setBoardType] = useState('ALL');
  const observerTarget = useRef(null);
  const limit = 10;

  // 사이드바용 인기글 데이터
  const popularNormalBoards = useMemo(() => {
    return [...boards]
      .filter(b => b.boardType === 'NORMAL')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 3);
  }, [boards]);

  const popularDebateBoards = useMemo(() => {
    return [...boards]
      .filter(b => b.boardType === 'DEBATE')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 3);
  }, [boards]);

  // 게시글 데이터 조회
  const fetchBoards = useCallback(async (currentOffset = 0, append = false) => {
    setLoading(true);
    try {
      let response;
      if (boardType !== 'ALL') {
        response = await boardApi.getBoardsByType(boardType, currentOffset, limit);
      } else if (searchKeyword) {
        response = await boardApi.searchBoards(searchKeyword, currentOffset, limit);
      } else {
        response = await boardApi.getBoards(currentOffset, limit);
      }

      const data = await response.json();
      const newBoards = Array.isArray(data) ? data : [];
      
      if (append) {
        setBoards(prev => [...prev, ...newBoards]);
      } else {
        setBoards(newBoards);
      }
      
      setHasMore(newBoards.length === limit);
      setOffset(currentOffset);
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [boardType, searchKeyword, limit]);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchBoards(0, false);
  }, [boardType, searchKeyword, fetchBoards]);

  // 무한 스크롤
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextOffset = offset + limit;
          fetchBoards(nextOffset, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, loading, offset, limit, fetchBoards]);

  const handleSearch = () => {
    setSearchKeyword(tempSearchKeyword);
    setOffset(0);
    setHasMore(true);
  };

  return (
    <div className="min-h-screen bg-[#e5e7eb] font-sans pb-20">
      
      {/* 1. 헤더 섹션 */}
      <div className="bg-[#d1d5db] py-16 px-4 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-12 tracking-tight">자유게시판</h1>
        
        {/* 검색창 */}
        <div className="w-full max-w-4xl relative">
          <div className="relative flex items-center w-full bg-[#e5e7eb] rounded-full border border-black shadow-sm overflow-hidden h-16">
            
            <input 
              type="text"
              className="pl-8 w-full bg-transparent focus:outline-none text-black text-lg placeholder-gray-500 h-full"
              placeholder="검색어를 입력하세요"
              value={tempSearchKeyword}
              onChange={(e) => setTempSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="pr-6 pl-4 h-full flex items-center justify-center hover:bg-black/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 메인 컨텐츠 */}
      <div className="max-w-[1400px] mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* 좌측 사이드바: 실시간 인기글 */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="bg-[#e5e7eb] border-2 border-gray-400 rounded-3xl p-6 sticky top-8 h-auto">
            <h3 className="font-bold text-lg mb-2 text-black">실시간 인기글</h3>
            
            {/* 일반 게시판 인기글 */}
            <div className="mb-8">
              <h4 className="font-medium text-black mb-3">일반 게시판</h4>
              <ul className="space-y-3">
                {popularNormalBoards.length > 0 ? popularNormalBoards.map(board => (
                  <li key={board.id} 
                      className="flex justify-between items-center text-sm border border-gray-400 rounded-full px-4 py-2 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/board/${board.id}`)}
                  >
                    <span className="text-black truncate mr-2 font-medium">{board.title}</span>
                    <span className="text-red-500 whitespace-nowrap font-medium text-xs">조회수 {board.viewCount}</span>
                  </li>
                )) : <li className="text-gray-500 text-xs text-center">게시글이 없습니다.</li>}
              </ul>
            </div>

            {/* 토론 게시판 인기글 */}
            <div>
              <h4 className="font-medium text-black mb-3">토론 게시판</h4>
              <ul className="space-y-3">
                {popularDebateBoards.length > 0 ? popularDebateBoards.map(board => (
                  <li key={board.id} 
                      className="flex justify-between items-center text-sm border border-gray-400 rounded-full px-4 py-2 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/board/${board.id}`)}
                  >
                    <span className="text-black truncate mr-2 font-medium">{board.title}</span>
                    <span className="text-red-500 whitespace-nowrap font-medium text-xs">조회수 {board.viewCount}</span>
                  </li>
                )) : <li className="text-gray-500 text-xs text-center">게시글이 없습니다.</li>}
              </ul>
            </div>
          </div>
        </aside>

        {/* 우측 메인 피드 */}
        <main className="flex-1 min-w-0">
          
          {/* 상단 필터 및 버튼 */}
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-4">
              
              {/* 필터 Select Box 복구 */}
              <select 
                className="px-4 py-1.5 rounded-full border border-black bg-[#e5e7eb] text-black text-sm font-medium focus:outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
              >
                <option value="ALL">전체 보기</option>
                <option value="NORMAL">일반 게시판</option>
                <option value="DEBATE">토론 게시판</option>
              </select>
            </div>
            
            <button 
              onClick={() => navigate('/board/create')}
              className="px-6 py-1.5 rounded-full border border-black bg-[#e5e7eb] hover:bg-gray-200 text-black text-sm font-medium transition-colors"
            >
              게시판 등록
            </button>
          </div>

          {/* 게시글 리스트 컨테이너 */}
          <div className="bg-[#e5e7eb] border-2 border-gray-400 rounded-3xl p-6 min-h-[600px]">
             <h3 className="font-medium text-lg mb-6 text-black ml-1">실시간 게시글</h3>
            
            <div className="space-y-4">
              {boards.map((board) => (
                <div 
                  key={board.id} 
                  onClick={() => navigate(`/board/${board.id}`)}
                  className="bg-[#e5e7eb] border border-black rounded-2xl p-5 cursor-pointer hover:bg-white transition-colors"
                >
                  {/* 상단 정보 */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                       <span className="text-black font-bold text-sm">
                          {board.boardType === 'DEBATE' ? '토론방' : '자유게시판'}
                       </span>
                       <span className="text-xs text-gray-600">
                         작성일 - {new Date(board.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                    <span className="text-black text-sm font-bold">{board.writerNickname}</span>
                  </div>

                  {/* 제목 */}
                  <h2 className="text-lg font-bold text-black mb-4 line-clamp-1">
                    제목 : {board.title}
                  </h2>

                  {/* 하단 통계 */}
                  <div className="flex justify-between items-center text-sm font-bold text-black">
                     <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <span className="text-red-500 text-lg">❤️</span> : {board.likeCount}개
                        </span>
                        <span className="flex items-center gap-1">
                          💬 : {board.commentCount}개
                        </span>
                     </div>
                     <span className="text-black">
                       조회수 : {board.viewCount}
                     </span>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="text-center py-8 text-gray-500 font-bold">
                  데이터를 불러오는 중...
                </div>
              )}
              
              {!loading && boards.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  등록된 게시글이 없습니다.
                </div>
              )}
              
              <div ref={observerTarget} className="h-4 w-full" />
            </div>
            
            <div className="h-8"></div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default BoardPage;