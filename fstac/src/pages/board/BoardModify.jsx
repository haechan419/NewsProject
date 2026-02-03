import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardApi, fileApi } from '../../api/boardApi';

function BoardModify() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [existingFiles, setExistingFiles] = useState([]);
  const [deleteFileIds, setDeleteFileIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  useEffect(() => {
    if (id) {
      fetchBoardDetail();
    }
  }, [id]);

  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.toLowerCase();
    return ext.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
  };

  const fetchBoardDetail = async () => {
    setLoading(true);
    try {
      const response = await boardApi.getBoardDetail(id);
      const data = await response.json();
      setFormData({
        title: data.title,
        content: data.content
      });
      setExistingFiles(data.files || []);
    } catch (error) {
      console.error('게시글 조회 실패:', error);
      alert('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExistingFile = (fileId) => {
    setDeleteFileIds([...deleteFileIds, fileId]);
    setExistingFiles(existingFiles.filter(f => f.id !== fileId));
  };

  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles([...newFiles, ...files]);
  };

  const handleDeleteNewFile = (index) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
  };

  const handleUpdateBoard = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('board', JSON.stringify({
        title: formData.title,
        content: formData.content,
        deleteFileIds: deleteFileIds
      }));
      
      if (newFiles.length > 0) {
        newFiles.forEach((file) => {
          formDataToSend.append('files', file);
        });
      }

      const response = await boardApi.updateBoard(id, formDataToSend);

      if (response.ok) {
        alert('게시글이 수정되었습니다.');
        navigate(`/board/${id}`);
      } else {
        const errorText = await response.text();
        throw new Error(`게시글 수정 실패: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('게시글 수정 실패:', error);
      alert('게시글 수정에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      
      {/* 헤더 섹션 */}
      <div className="bg-gray-100 py-12 px-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">게시글 수정</h1>
          <button 
            className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-full border border-gray-300 transition-colors text-sm font-medium"
            onClick={() => navigate(`/board/${id}`)}
          >
            취소
          </button>
        </div>
      </div>

      {/* 컨텐츠 섹션 */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white">
          <form onSubmit={handleUpdateBoard} className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="15"
                required
                className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none leading-relaxed"
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">첨부파일 관리</h3>
              
              {/* 기존 파일 목록 */}
              {existingFiles.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">기존 파일</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {existingFiles.map((file, index) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {isImageFile(file.originalFileName) ? (
                          <img 
                            src={fileApi.getDownloadUrl(file.storedFileName)} 
                            alt={file.originalFileName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <span className="text-2xl text-gray-400">📄</span>
                        )}
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sm font-medium truncate">{file.originalFileName}</div>
                          {index === 0 && isImageFile(file.originalFileName) && (
                            <span className="text-xs text-blue-600 font-medium">썸네일</span>
                          )}
                        </div>
                        <button 
                          type="button" 
                          className="px-3 py-1 bg-white hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded text-xs transition-colors"
                          onClick={() => handleDeleteExistingFile(file.id)}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 파일 추가 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">파일 추가</label>
                <div className="flex gap-2 mb-3">
                  <label className="px-4 py-2 bg-gray-900 text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors text-sm font-medium inline-flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    파일 선택
                    <input
                      type="file"
                      multiple
                      onChange={handleAddFiles}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {newFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-lg">🆕</span>
                          <span className="text-sm truncate font-medium text-blue-900">{file.name}</span>
                        </div>
                        <button 
                          type="button"
                          className="text-blue-400 hover:text-blue-700"
                          onClick={() => handleDeleteNewFile(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => navigate(`/board/${id}`)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-lg shadow-gray-200"
              >
                {loading ? '수정 중...' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BoardModify;
