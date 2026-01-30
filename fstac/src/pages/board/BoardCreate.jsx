import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { boardApi } from '../../api/boardApi';

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
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      {/* 헤더 섹션 */}
      <div className="bg-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold text-black">게시글 작성</h1>
          <button 
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-full border border-gray-300 transition-colors"
            onClick={() => navigate('/board')}
          >
            취소
          </button>
        </div>
      </div>

      {/* 컨텐츠 섹션 */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl border border-gray-300 p-8 shadow-sm">
          <form onSubmit={handleCreateBoard} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">게시판 타입</label>
              <select
                value={formData.boardType}
                onChange={(e) => setFormData({ ...formData, boardType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NORMAL">일반 게시판</option>
                <option value="DEBATE">토론 게시판</option>
              </select>
            </div>

            {formData.boardType === 'DEBATE' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">토론 주제</label>
                <input
                  type="text"
                  value={formData.debateTopic}
                  onChange={(e) => setFormData({ ...formData, debateTopic: e.target.value })}
                  placeholder="토론 주제를 입력하세요"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="제목을 입력하세요"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="15"
                placeholder="내용을 입력하세요"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">파일 첨부</label>
              <input
                type="file"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {selectedFiles.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  {selectedFiles.map((file, i) => <li key={i}>📎 {file.name}</li>)}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
              >
                작성 완료
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BoardCreate;