import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../layouts/TopBar';
import { boardApi, fileApi } from '../../api/boardApi';
import './BoardPage.css';

function BoardPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [boardType, setBoardType] = useState('ALL');

  // 게시글 목록 조회
  const fetchBoards = async (pageNum = 0) => {
    setLoading(true);
    try {
      let response;
      
      if (boardType !== 'ALL') {
        response = await boardApi.getBoardsByType(boardType, pageNum, 10);
      } else if (searchKeyword) {
        response = await boardApi.searchBoards(searchKeyword, pageNum, 10);
      } else {
        response = await boardApi.getBoards(pageNum, 10);
      }

      const data = await response.json();
      setBoards(data.content || []);
      setTotalPages(data.totalPages || 0);
      setPage(data.number || 0);
    } catch (error) {
      console.error('게시글 목록 조회 실패:', error);
      alert('게시글 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [boardType]);

  return (
    <div className="board-page-wrapper">
      <TopBar />
      
      {/* 헤더 섹션 */}
      <section className="board-hero-section">
        <div className="board-hero-title">
          <h1>커뮤니티 게시판</h1>
          <p>자유롭게 의견을 나누고 정보를 공유하는 공간입니다.</p>
        </div>
        <div className="board-top-actions">
          <button className="btn-primary" onClick={() => navigate('/board/create')}>
            글쓰기
          </button>
        </div>
      </section>

      {/* 컨텐츠 섹션 */}
      <section className="board-content-section">
        {/* 필터 및 검색 */}
        <div className="board-filters">
          <select value={boardType} onChange={(e) => {
            setBoardType(e.target.value);
            setSearchKeyword('');
          }}>
            <option value="ALL">전체 보기</option>
            <option value="NORMAL">일반 게시판</option>
            <option value="DEBATE">토론 게시판</option>
          </select>
          <input
            type="text"
            placeholder="관심있는 내용을 검색해보세요..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBoards(0)}
          />
          <button className="btn-primary" onClick={() => fetchBoards(0)}>검색</button>
        </div>

        {/* 게시글 리스트 */}
        {loading ? (
          <div className="loading">데이터를 불러오고 있습니다...</div>
        ) : (
          <>
            <div className="board-list">
              {boards.length === 0 ? (
                <div className="empty-state">등록된 게시글이 없습니다.</div>
              ) : (
                boards.map((board) => (
                  <div key={board.id} className="board-item" onClick={() => navigate(`/board/${board.id}`)}>
                    <div className="board-item-content">
                      {board.thumbnailUrl && (
                        <div className="board-item-thumbnail">
                          <img 
                            src={fileApi.getThumbnailUrl(board.thumbnailUrl)} 
                            alt="썸네일" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="board-item-info">
                        <div className="board-item-header">
                          <span className="board-type">{board.boardType === 'DEBATE' ? '토론' : '일반'}</span>
                          <h3 className="board-title">{board.title}</h3>
                        </div>
                        <div className="board-item-meta">
                          <span>작성자: {board.writerNickname}</span>
                          <span>조회수 {board.viewCount}</span>
                          <span>좋아요 {board.likeCount}</span>
                          <span>댓글 {board.commentCount}</span>
                          <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 페이지네이션 */}
            <div className="pagination">
              <button disabled={page === 0} onClick={() => fetchBoards(page - 1)}>
                이전
              </button>
              <span style={{ display:'flex', alignItems:'center', fontWeight:'bold', color:'#333' }}>
                {page + 1} / {totalPages || 1}
              </span>
              <button disabled={page >= totalPages - 1} onClick={() => fetchBoards(page + 1)}>
                다음
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default BoardPage;