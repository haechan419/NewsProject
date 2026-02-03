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
        setComments([]);
        return;
      }
      
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('댓글 목록 조회 실패:', error);
      setComments([]);
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

  // 투표
  const handleVote = async (voteType) => {
    try {
      const response = await boardApi.vote(id, {
        boardId: parseInt(id),
        voteType: voteType
      });
      const data = await response.json();
      
      if (board) {
        let newAgreeCount = board.agreeCount;
        let newDisagreeCount = board.disagreeCount;
        let newMyVoteType = data.voted ? data.voteType : null;

        if (board.myVoteType === 'AGREE') newAgreeCount--;
        else if (board.myVoteType === 'DISAGREE') newDisagreeCount--;

        if (data.voted) {
          if (data.voteType === 'AGREE') newAgreeCount++;
          else newDisagreeCount++;
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
      
      if (files && Array.isArray(files) && files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }
  
      const response = await commentApi.createComment(formData);
  
      if (response.ok) {
        await fetchComments();
        if (board) {
          setBoard({ ...board, commentCount: board.commentCount + 1 });
        }
      } else {
        const errorText = await response.text();
        alert(`댓글 작성에 실패했습니다: ${errorText || response.statusText}`);
      }
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      alert('댓글 작성에 실패했습니다: ' + error.message);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      const response = await commentApi.deleteComment(commentId);

      if (response.ok) {
        await fetchComments();
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
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

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

  const getVotePercent = () => {
    const total = (board?.agreeCount || 0) + (board?.disagreeCount || 0);
    if (total === 0) return { agree: 50, disagree: 50 };
    return {
      agree: Math.round((board.agreeCount / total) * 100),
      disagree: Math.round((board.disagreeCount / total) * 100)
    };
  };

  if (loading && !board) return <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>;
  if (!board) return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">게시글을 찾을 수 없습니다.</div>;

  const votePercent = getVotePercent();

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      
      {/* 헤더 섹션 */}
      <div className="bg-gray-100 py-12 px-4 border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <button 
            className="mb-6 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 rounded-full border border-gray-300 transition-colors text-sm font-medium flex items-center gap-1"
            onClick={() => navigate('/board')}
          >
            ← 목록으로
          </button>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-md text-sm font-bold ${
                board.boardType === 'DEBATE' 
                  ? 'bg-red-50 text-red-600' 
                  : 'bg-blue-50 text-blue-600'
              }`}>
                {board.boardType === 'DEBATE' ? '토론' : '자유'}
              </span>
              <span className="text-gray-500 text-sm">{new Date(board.createdAt).toLocaleString()}</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{board.title}</h1>
            
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                  {board.writerNickname?.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{board.writerNickname}</div>
                  <div className="text-xs text-gray-500">조회 {board.viewCount} · 댓글 {board.commentCount}</div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                  onClick={() => navigate(`/board/${id}/modify`)}
                >
                  수정
                </button>
                <button 
                  className="px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                  onClick={handleDeleteBoard}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 컨텐츠 섹션 */}
      <div className="max-w-4xl mx-auto px-4 mt-10">
        
        {/* 토론 투표 바 UI */}
        {board.boardType === 'DEBATE' && (
          <div className="mb-10 p-8 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-red-500">📢</span> 오늘의 토론 주제
            </h3>
            <p className="text-lg font-medium text-gray-800 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              {board.debateTopic}
            </p>
            
            {/* 투표 바 */}
            <div className="mb-3 relative h-14 rounded-full overflow-hidden bg-gray-100 flex cursor-pointer">
              <div 
                className={`flex items-center justify-center transition-all duration-500 ${board.myVoteType === 'AGREE' ? 'bg-blue-600' : 'bg-blue-500'} hover:bg-blue-600`}
                style={{ width: `${votePercent.agree}%` }}
                onClick={() => handleVote('AGREE')}
              >
                {votePercent.agree > 10 && <span className="text-white font-bold text-lg">{votePercent.agree}%</span>}
              </div>
              <div 
                className={`flex items-center justify-center transition-all duration-500 ${board.myVoteType === 'DISAGREE' ? 'bg-red-600' : 'bg-red-500'} hover:bg-red-600`}
                style={{ width: `${votePercent.disagree}%` }}
                onClick={() => handleVote('DISAGREE')}
              >
                {votePercent.disagree > 10 && <span className="text-white font-bold text-lg">{votePercent.disagree}%</span>}
              </div>
            </div>
            
            <div className="flex justify-between text-sm font-semibold px-2">
              <span className="text-blue-600">찬성 {board.agreeCount}표</span>
              <span className="text-red-600">반대 {board.disagreeCount}표</span>
            </div>
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed min-h-[200px] mb-12">
          {/* 이미지 갤러리 */}
          {board.files && board.files.filter(file => isImageFile(file.originalFileName)).length > 0 && (
            <div className="mb-8 not-prose">
              {(() => {
                const imageFiles = board.files.filter(file => isImageFile(file.originalFileName));
                return (
                  <div className="space-y-4">
                    {imageFiles.map((file) => (
                      <div key={file.id} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <img 
                          src={fileApi.getDownloadUrl(file.storedFileName)} 
                          alt={file.originalFileName}
                          className="w-full h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(fileApi.getDownloadUrl(file.storedFileName), '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
          
          <div className="whitespace-pre-wrap">{board.content}</div>
        </div>

        {/* 첨부파일 다운로드 */}
        {board.files && board.files.filter(file => !isImageFile(file.originalFileName)).length > 0 && (
          <div className="mb-12 p-5 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">첨부파일</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {board.files.filter(file => !isImageFile(file.originalFileName)).map((file) => (
                <a 
                  key={file.id}
                  href={fileApi.getDownloadUrl(file.storedFileName)} 
                  download={file.originalFileName}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:text-blue-600 transition-colors group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">📄</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{file.originalFileName}</span>
                    <span className="text-xs text-gray-500">{(file.fileSize / 1024).toFixed(2)} KB</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* 좋아요 및 공유 */}
        <div className="flex justify-center mb-16 border-t border-b border-gray-100 py-8">
           <button 
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
                board.isLiked 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={handleToggleLike}
           >
              <span>{board.isLiked ? '❤️' : '🤍'}</span>
              <span>좋아요</span>
              <span className="text-sm font-normal opacity-80 ml-1">{board.likeCount}</span>
           </button>
        </div>

        {/* 댓글 섹션 */}
        <div className="mb-20">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            댓글 <span className="text-blue-600">{Array.isArray(comments) ? comments.length : 0}</span>
          </h3>
          
          <CommentForm onSubmit={(content, files) => handleCreateComment(content, files)} />
          
          <div className="mt-8 space-y-6">
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
            <div className="text-center text-gray-400 py-12 bg-gray-50 rounded-xl">
              <p>아직 댓글이 없습니다.</p>
              <p className="text-sm">첫 번째 댓글을 남겨보세요!</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 하위 컴포넌트들
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
    <form onSubmit={handleSubmit} className="mb-8 bg-white p-1 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
      <textarea 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
        rows="3" 
        placeholder="댓글을 입력하세요..." 
        className="w-full px-4 py-3 rounded-lg focus:outline-none resize-none text-gray-800 placeholder-gray-400"
      />
      
      <div className="flex justify-between items-center px-2 pb-2">
        <div className="flex items-center gap-2">
          <label className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full cursor-pointer transition-colors" title="파일 첨부">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
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
                <span key={index} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                  {file.name}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveFile(index)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={!content.trim()}
          className="px-5 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
        >
          등록
        </button>
      </div>
    </form>
  );
}

function CommentItem({ comment, onReply, onDelete }) {
   const [showReply, setShowReply] = useState(false);
   
   return (
     <div className="group">
       <div className="flex gap-4">
         <div className="flex-shrink-0">
           <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
             {comment.writerNickname?.charAt(0)}
           </div>
         </div>
         
         <div className="flex-1 space-y-1">
           <div className="flex items-center gap-2">
             <span className="font-bold text-gray-900 text-sm">{comment.writerNickname}</span>
             <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
           </div>
           
           <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
             {comment.content}
           </div>

           {/* 댓글 첨부파일 */}
           {comment.files && comment.files.length > 0 && (
             <div className="mt-3 flex flex-wrap gap-2">
               {comment.files.map((file) => (
                 <div key={file.id}>
                   {isImageFile(file.originalFileName) ? (
                     <div 
                       className="relative group/img cursor-pointer"
                       onClick={() => window.open(fileApi.getDownloadUrl(file.storedFileName), '_blank')}
                     >
                       <img 
                         src={fileApi.getDownloadUrl(file.storedFileName)} 
                         alt={file.originalFileName}
                         className="h-24 w-auto rounded-lg border border-gray-200"
                       />
                     </div>
                   ) : (
                     <a 
                       href={fileApi.getDownloadUrl(file.storedFileName)} 
                       download={file.originalFileName}
                       className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                     >
                       📎 {file.originalFileName}
                     </a>
                   )}
                 </div>
               ))}
             </div>
           )}
           
           {!comment.isDeleted && (
             <div className="flex gap-3 pt-1">
               <button 
                 onClick={() => setShowReply(!showReply)}
                 className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
               >
                 답글달기
               </button>
               <button 
                 onClick={onDelete}
                 className="text-xs font-medium text-gray-400 hover:text-red-600 transition-colors"
               >
                 삭제
               </button>
             </div>
           )}
         </div>
       </div>

       {showReply && (
         <div className="mt-4 ml-14">
            <CommentForm onSubmit={(content, files) => { onReply(content, files); setShowReply(false); }} />
         </div>
       )}

       {/* 대댓글 렌더링 (재귀) */}
       {comment.replies && comment.replies.length > 0 && (
         <div className="mt-4 ml-14 space-y-6 border-l-2 border-gray-100 pl-6">
           {comment.replies.map(reply => (
             <CommentItem key={reply.id} comment={reply} onReply={onReply} onDelete={onDelete} />
           ))}
         </div>
       )}
     </div>
   );
}

export default BoardDetail;
