import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../layouts/TopBar';
import { boardApi, fileApi } from '../../api/boardApi';
import './BoardPage.css';

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
    <div className="board-page-wrapper">
      <TopBar />
      
      <section className="board-hero-section">
        <div className="board-hero-title">
          <h1>게시글 수정</h1>
        </div>
        <div className="board-top-actions">
          <button className="btn-secondary" onClick={() => navigate(`/board/${id}`)}>취소</button>
        </div>
      </section>

      <section className="board-content-section">
        <div className="board-detail-container">
          <form onSubmit={handleUpdateBoard}>
            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows="15"
                required
              />
              {/* 기존 파일 목록 */}
{existingFiles.length > 0 && (
  <div className="form-group">
    <label>기존 첨부파일</label>
    <div className="existing-files-list">
      {existingFiles.map((file, index) => (
        <div key={file.id} className="existing-file-item">
          {isImageFile(file.originalFileName) ? (
            <img 
              src={fileApi.getDownloadUrl(file.storedFileName)} 
              alt={file.originalFileName}
              className="file-thumbnail"
            />
          ) : (
            <span className="file-icon">📎</span>
          )}
          <span className="file-name">
            {index === 0 && isImageFile(file.originalFileName) && (
              <span className="thumbnail-badge">썸네일</span>
            )}
            {file.originalFileName}
          </span>
          <button 
            type="button" 
            className="btn-delete-file"
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
<div className="form-group">
  <label>파일 추가</label>
  <input
    type="file"
    multiple
    onChange={handleAddFiles}
  />
  {newFiles.length > 0 && (
    <div className="new-files-list">
      {newFiles.map((file, index) => (
        <div key={index} className="new-file-item">
          <span>{file.name}</span>
          <button 
            type="button"
            className="btn-delete-file"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '30px' }}>
              <button type="submit" className="btn-primary" disabled={loading}>
                수정 완료
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default BoardModify;


