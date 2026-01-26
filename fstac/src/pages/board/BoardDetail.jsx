import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import { boardApi, commentApi, fileApi } from '../../api/boardApi';
import './BoardPage.css';

// 이미지 파일 확장자 체크 함수
const isImageFile = (fileName) => {
  if (!fileName) return false;
  const ext = fileName.toLowerCase();
  return ext.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
};

function BoardDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // 게시글 상세 조회
  const fetchBoardDetail = async () => {
    setLoading(true);
    try {
      const response = await boardApi.getBoardDetail(id);
      const data = await response.json();
      setBoard(data);
      await fetchComments();
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error);
      alert('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 댓글 조회
  const fetchComments = async () => {
    try {
      const response = await commentApi.getComments(id);
      
      if (!response.ok) {
        // 에러 응답 처리
        const errorText = await response.text();
        console.error('댓글 목록 조회 실패:', response.status, errorText);
        setComments([]); // 빈 배열로 설정
        return;
      }
      
      const data = await response.json();
      // 배열인지 확인하고 설정
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      setComments([]); // 에러 시 빈 배열로 설정
    }
  };

  useEffect(() => {
    if (id) {
      fetchBoardDetail();
    }
  }, [id]);

  // 좋아요
  const handleToggleLike = async () => {
    try {
      const response = await boardApi.toggleLike(id);
      const data = await response.json();
      if (board) {
        setBoard({ 
          ...board, 
          isLiked: data.isLiked, 
          likeCount: data.isLiked ? board.likeCount + 1 : board.likeCount - 1 
        });
      }
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
  };

  // 투표 (조회수 증가 없이 상태만 업데이트)
  const handleVote = async (voteType) => {
    try {
      const response = await boardApi.vote(id, {
        boardId: parseInt(id),
        voteType: voteType
      });
      const data = await response.json();
      
      // 투표 결과에 따라 로컬 상태만 업데이트 (fetchBoardDetail 호출 X)
      if (board) {
        let newAgreeCount = board.agreeCount;
        let newDisagreeCount = board.disagreeCount;
        let newMyVoteType = data.voted ? data.voteType : null;

        // 이전 투표가 있었다면 카운트 감소
        if (board.myVoteType === 'AGREE') {
          newAgreeCount--;
        } else if (board.myVoteType === 'DISAGREE') {
          newDisagreeCount--;
        }

        // 새 투표가 있다면 카운트 증가
        if (data.voted) {
          if (data.voteType === 'AGREE') {
            newAgreeCount++;
          } else {
            newDisagreeCount++;
          }
        }

        setBoard({
          ...board,
          agreeCount: newAgreeCount,
          disagreeCount: newDisagreeCount,
          myVoteType: newMyVoteType
        });
      }
    } catch (error) {
      console.error('투표 실패:', error);
    }
  };

  // 댓글 작성
  const handleCreateComment = async (content, files = [], parentCommentId = null) => {
    try {
      const formData = new FormData();
      formData.append('comment', JSON.stringify({
        boardId: parseInt(id),
        content: content,
        parentCommentId: parentCommentId
      }));
      
      // files가 배열이고 길이가 있을 때만 추가
      if (files && Array.isArray(files) && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }
  
      // commentApi 사용 (CSRF 토큰 및 인증 정보 자동 포함)
      const response = await commentApi.createComment(formData);
  
      if (response.ok) {
        await fetchComments();
        if (board) {
          setBoard({ ...board, commentCount: board.commentCount + 1 });
        }
      } else {
        // 에러 응답 처리
        const errorText = await response.text();
        console.error('댓글 작성 실패:', response.status, errorText);
        alert(`댓글 작성에 실패했습니다: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다: ' + error.message);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await commentApi.deleteComment(commentId);

      if (response.ok) {
        await fetchComments();
        // 댓글 수만 로컬에서 업데이트
        if (board) {
          setBoard({ ...board, commentCount: Math.max(0, board.commentCount - 1) });
        }
      }
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 게시글 삭제
  const handleDeleteBoard = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await boardApi.deleteBoard(id);

      if (response.ok) {
        alert('게시글이 삭제되었습니다.');
        navigate('/board');
      } else {
        throw new Error('게시글 삭제 실패');
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 투표 퍼센트 계산
  const getVotePercent = () => {
    const total = (board?.agreeCount || 0) + (board?.disagreeCount || 0);
    if (total === 0) return { agree: 50, disagree: 50 };
    return {
      agree: Math.round((board.agreeCount / total) * 100),
      disagree: Math.round((board.disagreeCount / total) * 100)
    };
  };

  if (loading && !board) return <div className="loading">로딩 중...</div>;
  if (!board) return <div className="empty-state">게시글을 찾을 수 없습니다.</div>;

  const votePercent = getVotePercent();

  return (
    <div className="board-page-wrapper">
      <TopBar />
      
      {/* 헤더 섹션 */}
      <section className="board-hero-section">
        <div className="board-hero-title">
            <h1>게시글 상세</h1>
        </div>
        <div className="board-top-actions">
          <button className="btn-secondary" onClick={() => navigate('/board')}>목록으로</button>
          <button className="btn-primary" onClick={() => navigate(`/board/${id}/modify`)}>수정</button>
          <button className="btn-danger" onClick={handleDeleteBoard}>삭제</button>
        </div>
      </section>

      {/* 컨텐츠 섹션 */}
      <section className="board-content-section">
        <div className="board-detail-container">
          <div className="board-detail-header">
            <div className="board-detail-title">
              <span className="board-type">{board.boardType === 'DEBATE' ? '토론' : '일반'}</span>
              <h2>{board.title}</h2>
            </div>
            <div className="board-item-meta">
              <span>작성자: {board.writerNickname}</span>
              <span>조회수: {board.viewCount}</span>
              <span>좋아요: {board.likeCount}</span>
              <span>{new Date(board.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* 토론 투표 바 UI */}
          {board.boardType === 'DEBATE' && (
            <div className="debate-vote-section">
              <h3 className="debate-topic">토론 주제: {board.debateTopic}</h3>
              
              {/* 투표 바 */}
              <div className="vote-bar-container">
                <div className="vote-bar">
                  <div 
                    className={`vote-bar-agree ${board.myVoteType === 'AGREE' ? 'voted' : ''}`}
                    style={{ width: `${votePercent.agree}%` }}
                    onClick={() => handleVote('AGREE')}
                  >
                    {votePercent.agree > 15 && <span>찬성</span>}
                  </div>
                  <div 
                    className={`vote-bar-disagree ${board.myVoteType === 'DISAGREE' ? 'voted' : ''}`}
                    style={{ width: `${votePercent.disagree}%` }}
                    onClick={() => handleVote('DISAGREE')}
                  >
                    {votePercent.disagree > 15 && <span>반대</span>}
                  </div>
                </div>
              </div>
              
              {/* 투표 결과 텍스트 */}
              <div className="vote-result">
                <span className="vote-agree">찬성 {board.agreeCount}표 ({votePercent.agree}%)</span>
                <span className="vote-disagree">반대 {board.disagreeCount}표 ({votePercent.disagree}%)</span>
              </div>
            </div>
          )}

         {/* 이미지 갤러리 - 본문 위에 표시 */}
{board.files && board.files.filter(file => isImageFile(file.originalFileName)).length > 0 && (
  <div className="image-gallery">
    {(() => {
      const imageFiles = board.files.filter(file => isImageFile(file.originalFileName));
      const thumbnail = imageFiles[0];
      const otherImages = imageFiles.slice(1);
      
      return (
        <>
          {/* 썸네일 (첫 번째 이미지) */}
          <div className="thumbnail-image">
            <img 
              src={fileApi.getDownloadUrl(thumbnail.storedFileName)} 
              alt={thumbnail.originalFileName}
              onClick={() => window.open(fileApi.getDownloadUrl(thumbnail.storedFileName), '_blank')}
            />
          </div>
          
          {/* 나머지 이미지들 */}
          {otherImages.length > 0 && (
            <div className="other-images">
              {otherImages.map((file) => (
                <div key={file.id} className="other-image-item">
                  <img 
                    src={fileApi.getDownloadUrl(file.storedFileName)} 
                    alt={file.originalFileName}
                    onClick={() => window.open(fileApi.getDownloadUrl(file.storedFileName), '_blank')}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      );
    })()}
  </div>
)}

<div className="board-detail-content">
  <p>{board.content}</p>
</div>

{/* 기타 파일 다운로드 (이미지 제외) */}
{board.files && board.files.filter(file => !isImageFile(file.originalFileName)).length > 0 && (
  <div className="file-download-section">
    <h4>첨부파일</h4>
    <div className="file-download-list">
      {board.files.filter(file => !isImageFile(file.originalFileName)).map((file) => (
        <div key={file.id} className="file-download-item">
          <a href={fileApi.getDownloadUrl(file.storedFileName)} download={file.originalFileName}>
            📎 {file.originalFileName} ({(file.fileSize / 1024).toFixed(2)} KB)
          </a>
        </div>
      ))}
    </div>
  </div>
)}
          
          {/* 좋아요 버튼 */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
             <button 
                className={board.isLiked ? 'btn-primary' : 'btn-secondary'} 
                onClick={handleToggleLike}
             >
                {board.isLiked ? '❤️' : '🤍'} 좋아요
             </button>
          </div>

          {/* 댓글 섹션 */}
          <div className="comments-section">
            <h3>댓글 ({Array.isArray(comments) ? comments.length : 0})</h3>
            <CommentForm onSubmit={(content, files) => handleCreateComment(content, files)} />
            <div className="comments-list">
            {Array.isArray(comments) && comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={(content, files) => handleCreateComment(content, files, comment.id)}
                  onDelete={() => handleDeleteComment(comment.id)}
                />
              ))
            ) : (
              <div className="empty-state">댓글이 없습니다.</div>
            )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// 하위 컴포넌트들 (파일 하단에 꼭 포함되어야 합니다)
function CommentForm({ onSubmit }) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    if (content.trim()) { 
      onSubmit(content, files); 
      setContent(''); 
      setFiles([]);
    } 
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <div className="comment-form-content">
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          rows="2" 
          placeholder="댓글을 입력하세요..." 
        />
        <button type="submit" className="btn-primary">작성</button>
      </div>
      
      <div className="comment-form-file">
        <label className="file-attach-btn">
          📎 파일 첨부
          <input 
            type="file" 
            multiple 
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
        
        {files.length > 0 && (
          <div className="comment-file-list">
            {files.map((file, index) => (
              <span key={index} className="comment-file-item">
                {file.name}
                <button type="button" onClick={() => handleRemoveFile(index)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}

function CommentItem({ comment, onReply, onDelete }) {
   const [showReply, setShowReply] = useState(false);
   
   return (
     <div className="comment-item">
       <div className="comment-header">
         <span className="comment-author">{comment.writerNickname}</span>
         <span className="comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
       </div>
       <div className="comment-content" style={{ whiteSpace: 'pre-wrap' }}>
  {comment.content}
  
  {/* 댓글 첨부파일 */}
  {comment.files && comment.files.length > 0 && (
    <div className="comment-files">
      {comment.files.map((file) => (
        <div key={file.id} className="comment-file">
          {isImageFile(file.originalFileName) ? (
            <img 
              src={fileApi.getDownloadUrl(file.storedFileName)} 
              alt={file.originalFileName}
              onClick={() => window.open(fileApi.getDownloadUrl(file.storedFileName), '_blank')}
            />
          ) : (
            <a href={fileApi.getDownloadUrl(file.storedFileName)} download={file.originalFileName}>
              📎 {file.originalFileName}
            </a>
          )}
        </div>
      ))}
    </div>
  )}
</div>
       
       {!comment.isDeleted && (
         <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
           <button onClick={() => setShowReply(!showReply)} style={{ border:'none', background:'none', cursor:'pointer', fontSize:'12px', color:'#555' }}>답글</button>
           <button onClick={onDelete} style={{ border:'none', background:'none', cursor:'pointer', fontSize:'12px', color:'#ff6b6b' }}>삭제</button>
         </div>
       )}

{showReply && (
  <div style={{ marginTop: '10px', paddingLeft: '20px', borderLeft: '2px solid #ddd' }}>
     <CommentForm onSubmit={(content, files) => { onReply(content, files); setShowReply(false); }} />
  </div>
)}

       {/* 대댓글 렌더링 (재귀) */}
       {comment.replies && comment.replies.length > 0 && (
         <div style={{ marginTop: '15px', paddingLeft: '20px', borderLeft: '2px solid #ddd' }}>
           {comment.replies.map(reply => (
             <CommentItem key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} />
           ))}
         </div>
       )}
     </div>
   );
}

export default BoardDetail;