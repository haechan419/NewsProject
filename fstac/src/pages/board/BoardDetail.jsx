import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { boardApi, commentApi, fileApi } from '../../api/boardApi';

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

  if (loading && !board) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">로딩 중...</div>;
  if (!board) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">게시글을 찾을 수 없습니다.</div>;

  const votePercent = getVotePercent();

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      {/* 헤더 섹션 */}
      <div className="bg-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-4xl font-bold text-black">게시글 상세</h1>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 rounded-full border border-gray-300 transition-colors"
              onClick={() => navigate('/board')}
            >
              목록으로
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
              onClick={() => navigate(`/board/${id}/modify`)}
            >
              수정
            </button>
            <button 
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              onClick={handleDeleteBoard}
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 섹션 */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl border border-gray-300 p-8 shadow-sm">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-bold mr-2">
                {board.boardType === 'DEBATE' ? '토론' : '일반'}
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mt-2">{board.title}</h2>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>작성자: {board.writerNickname}</span>
              <span>조회수: {board.viewCount}</span>
              <span>좋아요: {board.likeCount}</span>
              <span>{new Date(board.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* 토론 투표 바 UI */}
          {board.boardType === 'DEBATE' && (
            <div className="mb-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">토론 주제: {board.debateTopic}</h3>
              
              {/* 투표 바 */}
              <div className="mb-4">
                <div className="flex h-12 rounded-lg overflow-hidden cursor-pointer border-2 border-gray-300">
                  <div 
                    className={`flex items-center justify-center transition-all ${board.myVoteType === 'AGREE' ? 'bg-green-600 text-white font-bold' : 'bg-green-400 text-white'}`}
                    style={{ width: `${votePercent.agree}%` }}
                    onClick={() => handleVote('AGREE')}
                  >
                    {votePercent.agree > 15 && <span>찬성</span>}
                  </div>
                  <div 
                    className={`flex items-center justify-center transition-all ${board.myVoteType === 'DISAGREE' ? 'bg-red-600 text-white font-bold' : 'bg-red-400 text-white'}`}
                    style={{ width: `${votePercent.disagree}%` }}
                    onClick={() => handleVote('DISAGREE')}
                  >
                    {votePercent.disagree > 15 && <span>반대</span>}
                  </div>
                </div>
              </div>
              
              {/* 투표 결과 텍스트 */}
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-green-700">찬성 {board.agreeCount}표 ({votePercent.agree}%)</span>
                <span className="text-red-700">반대 {board.disagreeCount}표 ({votePercent.disagree}%)</span>
              </div>
            </div>
          )}

         {/* 이미지 갤러리 - 본문 위에 표시 */}
{board.files && board.files.filter(file => isImageFile(file.originalFileName)).length > 0 && (
  <div className="mb-6">
    {(() => {
      const imageFiles = board.files.filter(file => isImageFile(file.originalFileName));
      const thumbnail = imageFiles[0];
      const otherImages = imageFiles.slice(1);
      
      return (
        <>
          {/* 썸네일 (첫 번째 이미지) */}
          <div className="mb-4">
            <img 
              src={fileApi.getDownloadUrl(thumbnail.storedFileName)} 
              alt={thumbnail.originalFileName}
              className="w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(fileApi.getDownloadUrl(thumbnail.storedFileName), '_blank')}
            />
          </div>
          
          {/* 나머지 이미지들 */}
          {otherImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {otherImages.map((file) => (
                <div key={file.id}>
                  <img 
                    src={fileApi.getDownloadUrl(file.storedFileName)} 
                    alt={file.originalFileName}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
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

<div className="mb-6 text-gray-800 whitespace-pre-wrap leading-relaxed">
  <p>{board.content}</p>
</div>

{/* 기타 파일 다운로드 (이미지 제외) */}
{board.files && board.files.filter(file => !isImageFile(file.originalFileName)).length > 0 && (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
    <h4 className="font-bold text-gray-800 mb-3">첨부파일</h4>
    <div className="space-y-2">
      {board.files.filter(file => !isImageFile(file.originalFileName)).map((file) => (
        <div key={file.id} className="flex items-center">
          <a 
            href={fileApi.getDownloadUrl(file.storedFileName)} 
            download={file.originalFileName}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            📎 {file.originalFileName} ({(file.fileSize / 1024).toFixed(2)} KB)
          </a>
        </div>
      ))}
    </div>
  </div>
)}
          
          {/* 좋아요 버튼 */}
          <div className="text-center mb-8">
             <button 
                className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                  board.isLiked 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                onClick={handleToggleLike}
             >
                {board.isLiked ? '❤️' : '🤍'} 좋아요
             </button>
          </div>

          {/* 댓글 섹션 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">댓글 ({Array.isArray(comments) ? comments.length : 0})</h3>
            <CommentForm onSubmit={(content, files) => handleCreateComment(content, files)} />
            <div className="mt-6 space-y-4">
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
              <div className="text-center text-gray-500 py-8">댓글이 없습니다.</div>
            )}
            </div>
          </div>
        </div>
      </div>
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
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2 mb-3">
        <textarea 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          rows="2" 
          placeholder="댓글을 입력하세요..." 
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          작성
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
          📎 파일 첨부
          <input 
            type="file" 
            multiple 
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <span key={index} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                {file.name}
                <button 
                  type="button" 
                  onClick={() => handleRemoveFile(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
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
     <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
       <div className="flex justify-between items-center mb-2">
         <span className="font-semibold text-gray-800">{comment.writerNickname}</span>
         <span className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
       </div>
       <div className="text-gray-700 whitespace-pre-wrap mb-3">
  {comment.content}
  
  {/* 댓글 첨부파일 */}
  {comment.files && comment.files.length > 0 && (
    <div className="mt-3 space-y-2">
      {comment.files.map((file) => (
        <div key={file.id}>
          {isImageFile(file.originalFileName) ? (
            <img 
              src={fileApi.getDownloadUrl(file.storedFileName)} 
              alt={file.originalFileName}
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(fileApi.getDownloadUrl(file.storedFileName), '_blank')}
            />
          ) : (
            <a 
              href={fileApi.getDownloadUrl(file.storedFileName)} 
              download={file.originalFileName}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              📎 {file.originalFileName}
            </a>
          )}
        </div>
      ))}
    </div>
  )}
</div>
       
       {!comment.isDeleted && (
         <div className="flex gap-2">
           <button 
             onClick={() => setShowReply(!showReply)}
             className="text-sm text-gray-600 hover:text-gray-800"
           >
             답글
           </button>
           <button 
             onClick={onDelete}
             className="text-sm text-red-600 hover:text-red-800"
           >
             삭제
           </button>
         </div>
       )}

{showReply && (
  <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-300">
     <CommentForm onSubmit={(content, files) => { onReply(content, files); setShowReply(false); }} />
  </div>
)}

       {/* 대댓글 렌더링 (재귀) */}
       {comment.replies && comment.replies.length > 0 && (
         <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-300 space-y-4">
           {comment.replies.map(reply => (
             <CommentItem key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} />
           ))}
         </div>
       )}
     </div>
   );
}

export default BoardDetail;