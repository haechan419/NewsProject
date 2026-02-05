import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi } from '../../api/boardApi';

function BoardPage() {
  const navigate = useNavigate();
  
  // 상태 관리
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tempSearchKeyword, setTempSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState('TITLE_CONTENT'); // TITLE, TITLE_CONTENT, WRITER
  const [boardType, setBoardType] = useState('ALL');
  const [popularBoards, setPopularBoards] = useState([]);
  const limit = 10;

  // 사이드바용 인기글 데이터
  const popularNormalBoards = useMemo(() => {
    return popularBoards
      .filter(b => b.boardType === 'NORMAL')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 3);
  }, [popularBoards]);

  const popularDebateBoards = useMemo(() => {
    return popularBoards
      .filter(b => b.boardType === 'DEBATE')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 3);
  }, [popularBoards]);

  // 게시글 데이터 조회
  const fetchBoards = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      let response;
      if (boardType !== 'ALL') {
        response = await boardApi.getBoardsByType(boardType, offset, limit);
      } else if (searchKeyword) {
        response = await boardApi.searchBoards(searchKeyword, searchType, offset, limit);
      } else {
        response = await boardApi.getBoards(offset, limit);
      }

      const data = await response.json();
      
      // 페이징 정보가 포함된 응답 처리
      if (data && data.boards) {
        setBoards(data.boards);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        // 하위 호환성: 배열로 반환되는 경우 (기존 API)
        const newBoards = Array.isArray(data) ? data : [];
        setBoards(newBoards);
        const estimatedTotal = newBoards.length === limit ? page * limit + 1 : page * limit;
        setTotalCount(estimatedTotal);
        setTotalPages(Math.ceil(estimatedTotal / limit));
      }
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [boardType, searchKeyword, searchType, limit]);

  // 인기글 조회 (별도로 조회)
  const fetchPopularBoards = useCallback(async () => {
    try {
      // 인기글을 위해 더 많은 게시글 조회 (조회수 순으로 정렬하기 위해 충분한 수량)
      const response = await boardApi.getBoards(0, 50);
      const data = await response.json();
      // 페이징 정보가 포함된 응답 처리
      const allBoards = data && data.boards ? data.boards : (Array.isArray(data) ? data : []);
      setPopularBoards(allBoards);
    } catch (error) {
      console.error('인기글 조회 실패:', error);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchBoards(1);
  }, [boardType, searchKeyword, fetchBoards]);

  // 컴포넌트 마운트 시 인기글 조회
  useEffect(() => {
    fetchPopularBoards();
  }, [fetchPopularBoards]);

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchBoards(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = () => {
    setSearchKeyword(tempSearchKeyword);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      {/* 인기글 애니메이션 스타일 */}
      <style>{`
        @keyframes dropBounce {
          0% { opacity: 0; transform: translateY(-50px) scale(0.8); }
          50% { opacity: 1; transform: translateY(10px) scale(1.05); }
          70% { transform: translateY(-5px) scale(0.98); }
          85% { transform: translateY(3px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shakeAfterDrop {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px) rotate(-1deg); }
          40% { transform: translateX(3px) rotate(1deg); }
          60% { transform: translateX(-2px) rotate(-0.5deg); }
          80% { transform: translateX(2px) rotate(0.5deg); }
        }
        .animate-drop-1 {
          animation: dropBounce 0.6s ease-out forwards, shakeAfterDrop 0.4s ease-in-out 0.6s;
        }
        .animate-drop-2 {
          animation: dropBounce 0.6s ease-out 0.15s forwards, shakeAfterDrop 0.4s ease-in-out 0.75s;
          opacity: 0;
        }
        .animate-drop-3 {
          animation: dropBounce 0.6s ease-out 0.3s forwards, shakeAfterDrop 0.4s ease-in-out 0.9s;
          opacity: 0;
        }
      `}</style>
      
      {/* 1. 헤더 섹션 (고객센터 스타일) */}
      <div className="w-full bg-slate-900 py-16 px-4 mb-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            자유게시판
          </h1>
          <p className="text-slate-300 text-lg">
            다양한 주제로 자유롭게 이야기를 나누어보세요.
          </p>
          
          {/* 검색창 */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="flex gap-2 items-center">
              {/* 검색 필터 선택 */}
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-4 rounded-full border-none outline-none bg-white text-gray-900 shadow-lg font-medium text-sm cursor-pointer"
              >
                <option value="TITLE">제목</option>
                <option value="TITLE_CONTENT">제목 + 내용</option>
                <option value="WRITER">작성자</option>
              </select>
              
              {/* 검색 입력창 */}
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder="관심있는 내용을 검색해보세요" 
                  className="w-full py-4 px-6 rounded-full border-none outline-none bg-white text-gray-900 shadow-lg placeholder-gray-400"
                  value={tempSearchKeyword}
                  onChange={(e) => setTempSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      handleSearch();
                    }
                  }}
                />
                <button 
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-900 font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={handleSearch}
                >
                  🔍
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 mt-12 flex flex-col lg:flex-row gap-10">
        
        {/* 좌측 사이드바: 실시간 인기글 */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-8">
            {/* 사이드바 카드 1 */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-md">
              <h3 className="font-extrabold text-xl mb-6 text-gray-900 flex items-center gap-2">
                {/* SVG 아이콘으로 교체: 배경 없는 깔끔한 빨간 화살표 */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 text-red-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <span>실시간 인기글</span>
              </h3>
              
              {/* 일반 게시판 섹션 */}
              <div className="mb-6 pb-6 border-b-2 border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  <h4 className="text-base font-bold text-blue-700 uppercase tracking-wide">일반 게시판</h4>
                </div>
                <ul className="space-y-3">
                  {popularNormalBoards.length > 0 ? popularNormalBoards.map((board, index) => (
                    <li key={board.id} 
                        className={`group cursor-pointer bg-blue-50 rounded-lg p-3 hover:bg-blue-100 transition-all border border-blue-100 hover:border-blue-300 ${
                          index === 0 ? 'animate-drop-1' : index === 1 ? 'animate-drop-2' : 'animate-drop-3'
                        }`}
                        onClick={() => navigate(`/board/${board.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        {/* 순위 배지 */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-300 text-orange-900' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-900 text-sm font-semibold group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug block">
                            {board.title}
                          </span>
                          <span className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            조회 {board.viewCount}
                          </span>
                        </div>
                      </div>
                    </li>
                  )) : <li className="text-gray-400 text-sm text-center py-4">게시글이 없습니다.</li>}
                </ul>
              </div>

              {/* 토론 게시판 섹션 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-red-600 rounded-full"></div>
                  <h4 className="text-base font-bold text-red-700 uppercase tracking-wide">토론 게시판</h4>
                </div>
                <ul className="space-y-3">
                  {popularDebateBoards.length > 0 ? popularDebateBoards.map((board, index) => (
                    <li key={board.id} 
                        className={`group cursor-pointer bg-red-50 rounded-lg p-3 hover:bg-red-100 transition-all border border-red-100 hover:border-red-300 ${
                          index === 0 ? 'animate-drop-1' : index === 1 ? 'animate-drop-2' : 'animate-drop-3'
                        }`}
                        onClick={() => navigate(`/board/${board.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        {/* 순위 배지 */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-300 text-orange-900' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-900 text-sm font-semibold group-hover:text-red-700 transition-colors line-clamp-2 leading-snug block">
                            {board.title}
                          </span>
                          <span className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            조회 {board.viewCount}
                          </span>
                        </div>
                      </div>
                    </li>
                  )) : <li className="text-gray-400 text-sm text-center py-4">게시글이 없습니다.</li>}
                </ul>
              </div>
            </div>
          </div>
        </aside>

        {/* 우측 메인 피드 */}
        <main className="flex-1 min-w-0">
          
          {/* 상단 필터 및 버튼 */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <div className="flex gap-2">
              {['ALL', 'NORMAL', 'DEBATE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setBoardType(type)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    boardType === type
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  {type === 'ALL' ? '전체' : type === 'NORMAL' ? '일반' : '토론'}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => navigate('/board/create')}
              className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center gap-1.5"
            >
              <span className="text-lg">+</span>
              <span>게시글 등록</span>
            </button>
          </div>

          {/* 게시글 리스트 */}
          <div className="space-y-2">
            {boards.map((board) => (
              <div 
                key={board.id} 
                onClick={() => navigate(`/board/${board.id}`)}
                className="group bg-white border border-gray-200 rounded-md p-3 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all duration-300"
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                      board.boardType === 'DEBATE' 
                        ? 'bg-red-50 text-red-600' 
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {board.boardType === 'DEBATE' ? '토론' : '자유'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(board.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <h2 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {board.title}
                </h2>
                
                {/* 내용 미리보기 (선택 사항) */}
                <p className="text-gray-600 text-xs mb-2 line-clamp-1 h-4 leading-relaxed">
                  {board.content}
                </p>

                <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    {/* 프로필 이미지 대신 닉네임 */}
                    <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {board.writerNickname?.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-gray-600">{board.writerNickname}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-gray-400 font-medium">
                    <span className="flex items-center gap-0.5 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {board.likeCount}
                    </span>
                    <span className="flex items-center gap-0.5 hover:text-blue-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {board.commentCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {board.viewCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}
            
            {!loading && boards.length === 0 && (
              <div className="text-center py-24 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                <p className="text-lg font-medium">등록된 게시글이 없습니다.</p>
                <p className="text-sm mt-2">첫 번째 게시글을 작성해보세요!</p>
              </div>
            )}
          </div>
          
          {/* 페이지네이션 */}
          {!loading && boards.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 mb-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                이전
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-gray-900 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                다음
              </button>
            </div>
          )}
          
          <div className="h-8"></div>
        </main>
      </div>
    </div>
  );
}

export default BoardPage;
