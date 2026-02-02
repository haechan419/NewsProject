import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi } from '../../api/boardApi';
import '../BoardPage.css';

const API_BASE_URL = 'http://localhost:8080/api';

function Board() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [boardType, setBoardType] = useState('ALL');

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
  }, [boardType, searchKeyword]);

  const handleBoardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  return (
    <div className="board-page">
      <div className="board-header">
        <h1>게시판</h1>
        <button className="btn-primary" onClick={() => navigate('/board/create')}>
          글쓰기
        </button>
      </div>

      <div className="board-filters">
        <select value={boardType} onChange={(e) => {
          setBoardType(e.target.value);
          setSearchKeyword('');
        }}>
          <option value="ALL">전체</option>
          <option value="NORMAL">일반 게시판</option>
          <option value="DEBATE">토론 게시판</option>
        </select>
        <input
          type="text"
          placeholder="검색어 입력..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              fetchBoards(0);
            }
          }}
        />
        <button onClick={() => fetchBoards(0)}>검색</button>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
          <div className="board-list">
            {boards.length === 0 ? (
              <div className="empty-state">게시글이 없습니다.</div>
            ) : (
              boards.map((board) => (
                <div key={board.id} className="board-item" onClick={() => handleBoardClick(board.id)}>
                  <div className="board-item-content">
                    {board.thumbnailUrl && (
                      <div className="board-item-thumbnail">
                        <img 
                          src={`http://localhost:8080${board.thumbnailUrl}`} 
                          alt="썸네일" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="board-item-info">
                      <div className="board-item-header">
                        <span className="board-type">{board.boardType === 'DEBATE' ? '토론' : '일반'}</span>
                        <span className="board-title">{board.title}</span>
                      </div>
                      <div className="board-item-meta">
                        <span>작성자: {board.writerNickname}</span>
                        <span>조회수: {board.viewCount}</span>
                        <span>좋아요: {board.likeCount}</span>
                        <span>댓글: {board.commentCount}</span>
                        <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                      </div>
                      {board.boardType === 'DEBATE' && (
                        <div className="board-debate-info">
                          찬성: {board.agreeCount} | 반대: {board.disagreeCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pagination">
            <button disabled={page === 0} onClick={() => fetchBoards(page - 1)}>
              이전
            </button>
            <span>{page + 1} / {totalPages || 1}</span>
            <button disabled={page >= totalPages - 1} onClick={() => fetchBoards(page + 1)}>
              다음
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Board;


