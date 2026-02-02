import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi, fileApi } from '../../api/boardApi';
// 기존 BoardPage.css import는 제거하거나 비워주세요.
// import './BoardPage.css'; 

function BoardPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tempSearchKeyword, setTempSearchKeyword] = useState(''); // 검색 버튼 클릭 시 적용할 임시 state
  const [boardType, setBoardType] = useState('ALL');
  const observerTarget = useRef(null);
  const limit = 10;

  // 사이드바용 인기글 데이터 (현재 로드된 글 중에서 조회수 순으로 정렬하여 추출)
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

  // 게시글 목록 조회
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
      alert('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [boardType, searchKeyword, limit]);

  // 초기 로드 및 필터/검색어 변경 시
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchBoards(0, false);
  }, [boardType, searchKeyword, fetchBoards]);

  // 무한 스크롤 감지
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

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, offset, limit, fetchBoards]);

  // 검색 핸들러
  const handleSearch = () => {
    setSearchKeyword(tempSearchKeyword);
    setOffset(0);
    setHasMore(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      {/* 1. 상단 헤더 영역 */}
      <div className="bg-gray-200 py-12 px-4 text-center">
        <h1 className="text-4xl font-bold text-black mb-10">자유게시판</h1>
        
        {/* 검색창 (이미지와 동일하게 둥글고 큰 디자인) */}
        <div className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center w-full">
            <span className="absolute left-6 text-gray-500 font-medium">Search</span>
            <input 
              type="text"
              className="w-full pl-24 pr-12 py-4 rounded-full bg-gray-100 border-2 border-gray-300 focus:outline-none focus:border-gray-400 shadow-sm text-lg placeholder-red-400"
              placeholder="검색어를 입력하세요"
              value={tempSearchKeyword}
              onChange={(e) => setTempSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <button 
              onClick={handleSearch}
              className="absolute right-4 p-2 rounded-full hover:bg-gray-200"
            >
              {/* 돋보기 아이콘 SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 메인 컨텐츠 영역 (2단 레이아웃) */}
      <div className="max-w-7xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-6">
        
        {/* 왼쪽 사이드바 (실시간 인기글 - Sticky) */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-300 p-5 sticky top-4 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-black border-b pb-2">실시간 인기글</h3>
            <p className="text-xs text-red-500 mb-4 -mt-2">스크롤 할때마다 따라다님</p>
            
            {/* 일반 게시판 인기글 */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-2 text-sm">일반 게시판</h4>
              <ul className="space-y-2">
                {popularNormalBoards.length > 0 ? popularNormalBoards.map(board => (
                  <li key={board.id} className="flex justify-between items-center text-sm border-2 border-red-100 rounded-full px-3 py-1 cursor-pointer hover:bg-red-50" onClick={() => navigate(`/board/${board.id}`)}>
                    <span className="truncate flex-1 mr-2 text-gray-600">{board.title}</span>
                    <span className="text-red-500 text-xs whitespace-nowrap">조회수 {board.viewCount}</span>
                  </li>
                )) : <li className="text-gray-400 text-xs">인기글이 없습니다.</li>}
              </ul>
            </div>

            {/* 토론 게시판 인기글 */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2 text-sm">토론 게시판</h4>
              <ul className="space-y-2">
                {popularDebateBoards.length > 0 ? popularDebateBoards.map(board => (
                  <li key={board.id} className="flex justify-between items-center text-sm border-2 border-red-100 rounded-full px-3 py-1 cursor-pointer hover:bg-red-50" onClick={() => navigate(`/board/${board.id}`)}>
                    <span className="truncate flex-1 mr-2 text-gray-600">{board.title}</span>
                    <span className="text-red-500 text-xs whitespace-nowrap">조회수 {board.viewCount}</span>
                  </li>
                )) : <li className="text-gray-400 text-xs">인기글이 없습니다.</li>}
              </ul>
            </div>
          </div>
        </aside>

        {/* 오른쪽 메인 피드 */}
        <main className="flex-1 min-w-0">
          
          {/* 필터 및 글쓰기 버튼 */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setBoardType('ALL')}
                className={`px-4 py-1.5 rounded-full text-sm border ${boardType === 'ALL' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
              >
                전체
              </button>
              <div className="text-xs text-red-500 flex items-center ml-2">
                필터 → 전체, 일반 게시판, 토론 게시판
              </div>
            </div>
            
            <div className="flex gap-2">
               <select 
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-full bg-white focus:outline-none"
                  value={boardType}
                  onChange={(e) => setBoardType(e.target.value)}
                >
                  <option value="ALL">전체보기</option>
                  <option value="NORMAL">일반 게시판</option>
                  <option value="DEBATE">토론 게시판</option>
              </select>
              <button 
                onClick={() => navigate('/board/create')}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-black text-sm rounded-full border border-gray-400 transition-colors"
              >
                게시판 등록
              </button>
            </div>
          </div>

          {/* 메인 리스트 컨테이너 */}
          <div className="bg-transparent space-y-4">
             {/* 실시간 게시글 헤더 */}
             <div className="bg-white border border-gray-300 rounded-t-2xl p-4 pb-2">
                <h3 className="font-bold text-gray-800">실시간 게시글</h3>
             </div>
            
            {loading && boards.length === 0 ? (
              <div className="bg-white border border-gray-300 rounded-b-2xl p-10 text-center text-gray-500">
                로딩 중입니다...
              </div>
            ) : boards.length === 0 ? (
              <div className="bg-white border border-gray-300 rounded-b-2xl p-10 text-center text-gray-500">
                등록된 게시글이 없습니다.
              </div>
            ) : (
              <>
                {boards.map((board) => (
                  <div 
                    key={board.id} 
                    onClick={() => navigate(`/board/${board.id}`)}
                    className="bg-white border border-gray-300 rounded-2xl p-5 cursor-pointer hover:shadow-md hover:border-gray-400 transition-all"
                  >
                    {/* 카드 상단: 타입 | 작성자 | 날짜 */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                         <span className="text-red-500 font-bold text-sm mb-1">
                            {board.boardType === 'DEBATE' ? '토론방' : '자유게시판'}
                         </span>
                         <span className="text-xs text-gray-500">작성일 - {new Date(board.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="text-red-500 text-sm font-medium">{board.writerNickname}</span>
                    </div>

                    {/* 카드 중단: 제목 */}
                    <h2 className="text-lg font-bold text-red-600 mb-4 line-clamp-1">
                      제목 : {board.title}
                    </h2>

                    {/* 카드 하단: 좋아요 | 댓글 | 조회수 */}
                    <div className="flex justify-between items-center text-sm font-bold">
                       <div className="flex items-center gap-4 text-red-600">
                          <span className="flex items-center gap-1">
                            ❤️ : {board.likeCount}개
                          </span>
                          <span className="flex items-center gap-1">
                            💬 : {board.commentCount}개
                          </span>
                       </div>
                       <span className="text-red-600">
                         조회수 : {board.viewCount}
                       </span>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* 무한 스크롤 타겟 */}
            <div ref={observerTarget} className="h-4 w-full"></div>
            
            {loading && hasMore && (
              <div className="text-center py-4 text-red-500 font-bold">
                무한 스크롤 적용! 데이터를 불러오는 중...
              </div>
            )}
            
            {/* 리스트 하단 마감 (마지막 아이템 밑에 라운드 처리 등을 위해 빈 div 필요시 사용) */}
            <div className="h-4"></div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default BoardPage;