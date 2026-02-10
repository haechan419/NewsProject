import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../layouts/TopBar';
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
<<<<<<< HEAD
    <div className="min-h-screen bg-white font-sans pb-20">
      
      {/* 헤더 섹션 */}
      <div className="bg-gray-100 py-12 px-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">게시글 작성</h1>
          <button 
            className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-full border border-gray-300 transition-colors text-sm font-medium"
            onClick={() => navigate('/board')}
          >
            취소
          </button>
=======
    <div className="board-page-wrapper">
      <TopBar />
      
      <section className="board-hero-section">
        <div className="board-hero-title">
          <h1>게시글 작성</h1>
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
        </div>
        <div className="board-top-actions">
           <button className="btn-secondary" onClick={() => navigate('/board')}>취소</button>
        </div>
      </section>

<<<<<<< HEAD
      {/* 컨텐츠 섹션 */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white">
          <form onSubmit={handleCreateBoard} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">게시판 선택</label>
                <div className="relative">
                  <select
                    value={formData.boardType}
                    onChange={(e) => setFormData({ ...formData, boardType: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none"
                  >
                    <option value="NORMAL">자유 게시판</option>
                    <option value="DEBATE">토론 게시판</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                    ▼
                  </div>
                </div>
              </div>

              {formData.boardType === 'DEBATE' && (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">토론 주제 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.debateTopic}
                    onChange={(e) => setFormData({ ...formData, debateTopic: e.target.value })}
                    placeholder="토론 주제를 입력하세요"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">제목 <span className="text-red-500">*</span></label>
=======
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
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="제목을 입력하세요"
                required
<<<<<<< HEAD
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-lg font-medium placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">내용 <span className="text-red-500">*</span></label>
=======
              />
            </div>

            <div className="form-group">
              <label>내용</label>
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="15"
                placeholder="내용을 입력하세요"
                required
<<<<<<< HEAD
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">파일 첨부</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-gray-600 font-medium">클릭하여 파일을 업로드하세요</span>
                  <span className="text-xs text-gray-400">또는 파일을 여기로 드래그하세요</span>
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-lg">📎</span>
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => navigate('/board')}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-lg shadow-gray-200"
              >
                {loading ? '등록 중...' : '게시글 등록'}
=======
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
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default BoardCreate;
