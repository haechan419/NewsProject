import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import { boardApi } from '../../api/boardApi';
import './BoardPage.css';

function BoardCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    boardType: 'NORMAL',
    title: '',
    content: '',
    debateTopic: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('board', JSON.stringify(formData));
      
      if (selectedFiles && selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formDataToSend.append('files', file);
        });
      }

      const response = await boardApi.createBoard(formDataToSend);

      if (response.ok) {
        const result = await response.json();
        alert('게시글이 생성되었습니다.');
        navigate(`/board/${result.boardId}`);
      } else {
        throw new Error('게시글 생성 실패');
      }
    } catch (error) {
      console.error('게시글 생성 실패:', error);
      alert('게시글 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="board-page-wrapper">
      <TopBar />
      
      <section className="board-hero-section">
        <div className="board-hero-title">
          <h1>게시글 작성</h1>
        </div>
        <div className="board-top-actions">
           <button className="btn-secondary" onClick={() => navigate('/board')}>취소</button>
        </div>
      </section>

      <section className="board-content-section">
        <div className="board-detail-container">
          <form onSubmit={handleCreateBoard}>
            <div className="form-group">
              <label>게시판 타입</label>
              <select
                value={formData.boardType}
                onChange={(e) => setFormData({ ...formData, boardType: e.target.value })}
              >
                <option value="NORMAL">일반 게시판</option>
                <option value="DEBATE">토론 게시판</option>
              </select>
            </div>

            {formData.boardType === 'DEBATE' && (
              <div className="form-group">
                <label>토론 주제</label>
                <input
                  type="text"
                  value={formData.debateTopic}
                  onChange={(e) => setFormData({ ...formData, debateTopic: e.target.value })}
                  placeholder="토론 주제를 입력하세요"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label>내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="15"
                placeholder="내용을 입력하세요"
                required
              />
            </div>

            <div className="form-group">
              <label>파일 첨부</label>
              <input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              />
              {selectedFiles.length > 0 && (
                <ul style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  {selectedFiles.map((file, i) => <li key={i}>{file.name}</li>)}
                </ul>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                작성 완료
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default BoardCreate;