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
  const [existingFiles, setExistingFiles] = useState([]); // 기존 파일 목록
  const [deleteFileIds, setDeleteFileIds] = useState([]); // 삭제할 파일 ID
  const [newFiles, setNewFiles] = useState([]); // 새로 추가할 파일

  useEffect(() => {
    if (id) {
      fetchBoardDetail();
    }
  }, [id]);

  // 이미지 파일 확장자 체크 함수
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

// 기존 파일 삭제 (로컬 상태에서만 - 실제 삭제는 저장 시)
const handleDeleteExistingFile = (fileId) => {
  setDeleteFileIds([...deleteFileIds, fileId]);
  setExistingFiles(existingFiles.filter(f => f.id !== fileId));
};

// 새 파일 추가
const handleAddFiles = (e) => {
  const files = Array.from(e.target.files);
  setNewFiles([...newFiles, ...files]);
};

// 새 파일 삭제 (아직 업로드 전)
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
    
    // 새 파일 추가
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
      console.error('게시글 수정 실패:', response.status, errorText);
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
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      {/* 헤더 섹션 */}
      <div className="bg-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold text-black">게시글 수정</h1>
          <button 
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-full border border-gray-300 transition-colors"
            onClick={() => navigate(`/board/${id}`)}
          >
            취소
          </button>
        </div>
      </div>

      {/* 컨텐츠 섹션 */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl border border-gray-300 p-8 shadow-sm">
          <form onSubmit={handleUpdateBoard} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* 기존 파일 목록 */}
              {existingFiles.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">기존 첨부파일</label>
                  <div className="space-y-2">
                    {existingFiles.map((file, index) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {isImageFile(file.originalFileName) ? (
                          <img 
                            src={fileApi.getDownloadUrl(file.storedFileName)} 
                            alt={file.originalFileName}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <span className="text-2xl">📎</span>
                        )}
                        <span className="flex-1 text-sm">
                          {index === 0 && isImageFile(file.originalFileName) && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs mr-2">썸네일</span>
                          )}
                          {file.originalFileName}
                        </span>
                        <button 
                          type="button" 
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm transition-colors"
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
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">파일 추가</label>
                <input
                  type="file"
                  multiple
                  onChange={handleAddFiles}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {newFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{file.name}</span>
                        <button 
                          type="button"
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm transition-colors"
                          onClick={() => handleDeleteNewFile(index)}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50"
              >
                수정 완료
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BoardModify;


