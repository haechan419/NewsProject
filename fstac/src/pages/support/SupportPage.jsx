// SupportPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getFaqs, getFaqById, createFaq, updateFaq, deleteFaq, searchFaqs } from '../../api/faqApi';
import { sendQaMessage } from '../../api/qaApi';
import { getMyInquiries, createInquiry, getInquiryById, getAllInquiries, updateInquiry, getInquiryByIdForAdmin } from '../../api/inquiryApi';
import apiClient from '../../api/axios';

// ★ 업로드하신 이미지를 import 합니다 (경로는 실제 파일 위치에 맞게 수정해주세요)
// 만약 이미지가 없다면 주석 처리하고 이모티콘을 사용하세요.
import chatIcon from '../../assets/images/chat-icon.png';
import emailIcon from '../../assets/images/email.png'; 

// 카테고리 정보
const CATEGORIES = [
  { value: 'VIDEO', label: '영상제작' },
  { value: 'POST', label: '게시물작성' },
  { value: 'ACCOUNT', label: '프로필/계정' },
  { value: 'ETC', label: '기타' }
];

const SupportPage = () => {
  const { user } = useSelector((state) => state.auth);
  
  const isAdmin = Boolean(
    user?.roleNames?.includes('ADMIN') || 
    user?.roles?.includes('ADMIN') || 
    user?.memberRoleList?.includes('ADMIN') ||
    user?.roleNames?.some(role => role === 'ADMIN' || role === 'ROLE_ADMIN')
  );

  // activeTab: 초기값은 'faq' (메인화면)
  const [activeTab, setActiveTab] = useState('faq'); 
  
  // FAQ 관련 상태
  const [faqs, setFaqs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [faqLoading, setFaqLoading] = useState(false);
  const [readFaqModal, setReadFaqModal] = useState(null);
  const [visibleCount, setVisibleCount] = useState(8); // ★ 처음에 보여줄 개수 8개
  const [searchTerm, setSearchTerm] = useState(''); // 검색어 상태

  // 챗봇 관련 상태
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 문의 관련 상태
  const [inquiries, setInquiries] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({ title: '', content: '', category: '' });
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // FAQ 관리자 모달
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ category: 'VIDEO', question: '', answer: '', keywords: '' });
  const [adminResponse, setAdminResponse] = useState('');

  useEffect(() => {
    apiClient.get('/api/category/list').catch(() => {});
  }, []);

  // 카테고리가 변경될 때마다 FAQ 다시 로드 & 더보기 카운트 초기화
  useEffect(() => {
    setSearchTerm('');
    loadFaqs();
    setVisibleCount(8); 
  }, [selectedCategory]);

  useEffect(() => {
    if (activeTab === 'inquiry' || activeTab === 'inquiry-admin') {
      loadInquiries();
    }
  }, [activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadFaqs = async () => {
    setFaqLoading(true);
    try {
      const data = await getFaqs(selectedCategory);
      setFaqs(data);
    } catch (error) {
      console.error('Error loading FAQs:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadFaqs(); // 검색어가 없으면 전체 목록 다시 로드
      return;
    }
    setFaqLoading(true);
    try {
      const data = await searchFaqs(searchTerm, selectedCategory);
      setFaqs(data);
      setVisibleCount(8);
    } catch (error) {
      console.error('Error searching FAQs:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const loadInquiries = async () => {
    setInquiryLoading(true);
    try {
      const data = activeTab === 'inquiry-admin' ? await getAllInquiries() : await getMyInquiries();
      setInquiries(data);
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleFaqClick = async (faqId) => {
    try {
      const faq = await getFaqById(faqId);
      setReadFaqModal(faq);
    } catch (error) { console.error(error); }
  };

  // ★ 더보기 버튼 핸들러
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || qaLoading) return;
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setQaLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendQaMessage(userMessage, sessionId, history);
      setSessionId(response.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다.' }]);
    } finally {
      setQaLoading(false);
    }
  };

  // ... (문의 생성, 조회, 답변 등 기존 로직 유지 - 코드 길이를 위해 생략하지 않고 기능 보존)
  const handleCreateInquiry = async () => {
    if (!inquiryForm.title.trim() || !inquiryForm.content.trim()) return;
    try {
      await createInquiry({ ...inquiryForm, category: inquiryForm.category || null });
      setShowCreateModal(false);
      setInquiryForm({ title: '', content: '', category: '' });
      loadInquiries();
      alert('문의 등록 완료');
    } catch (error) { alert('실패'); }
  };

  const handleViewInquiry = async (id) => {
    try {
      const data = await getInquiryById(id);
      setSelectedInquiry(data);
      setAdminResponse(data.adminResponse || '');
      setShowDetailModal(true);
    } catch (error) {}
  };

  const handleViewInquiryForAdmin = async (id) => {
    try {
      const data = await getInquiryByIdForAdmin(id);
      setSelectedInquiry(data);
      setAdminResponse(data.adminResponse || '');
      setShowDetailModal(true);
    } catch (error) {}
  };

  const handleAdminResponse = async () => {
    if (!adminResponse.trim()) return;
    try {
      await updateInquiry(selectedInquiry.id, { status: 'COMPLETED', adminResponse });
      setShowDetailModal(false);
      loadInquiries();
      alert('답변 등록 완료');
    } catch (error) {}
  };

  const handleSaveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    try {
      editingFaq ? await updateFaq(editingFaq.id, faqForm) : await createFaq(faqForm);
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqForm({ category: 'VIDEO', question: '', answer: '', keywords: '' });
      loadFaqs();
    } catch (error) {}
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await deleteFaq(id);
      if (readFaqModal?.id === id) setReadFaqModal(null);
      loadFaqs();
    } catch (error) {}
  };

  const openEditFaqModal = (faq) => {
    setEditingFaq(faq);
    setFaqForm({ category: faq.category, question: faq.question, answer: faq.answer, keywords: faq.keywords || '' });
    setReadFaqModal(null);
    setShowFaqModal(true);
  };

  // 뒤로가기 버튼 컴포넌트
  const BackButton = () => (
    <button 
      onClick={() => setActiveTab('faq')}
      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold mb-6 transition-colors group"
    >
      <span className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center">←</span>
      <span>고객센터 홈으로</span>
    </button>
  );

  return (
    <div className="min-h-[calc(100vh-140px)] bg-white pb-20">
      
      {/* [1] 고정 헤더 섹션 (빨간 박스 영역) 
        - 배경색: slate-900 (진한 네이비/블랙 계열)
        - 텍스트: 중앙 정렬
      */}
      <div className="w-full bg-slate-900 py-16 px-4 mb-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
            고객센터
          </h1>
          <p className="text-slate-300 text-lg">
            무엇을 도와드릴까요? 궁금한 내용을 검색하거나 선택해주세요.
          </p>
          
          {/* 검색창 */}
          <div className="mt-8 relative max-w-xl mx-auto">
             <input 
                type="text" 
                placeholder="궁금한 점을 검색해보세요" 
                className="w-full py-4 px-6 rounded-full border-none outline-none bg-white text-gray-900 shadow-lg placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleSearch();
                  }
                }}
             />
             <button 
               className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-900 font-bold p-2 hover:bg-gray-100 rounded-full transition-colors"
               onClick={handleSearch}
             >
               🔍
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        
        {/* 메인 화면 (FAQ 목록) - 탭 버튼 제거됨 */}
        {activeTab === 'faq' && (
          <div className="space-y-12 animate-fadeIn">
            
            {/* 카테고리 필터 (중앙 정렬) */}
            <div className="flex flex-wrap gap-2 items-center justify-center">
              <button 
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border
                  ${selectedCategory === null 
                    ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                onClick={() => setSelectedCategory(null)}
              >
                전체
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.value}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border
                    ${selectedCategory === cat.value 
                      ? 'bg-slate-800 border-slate-800 text-white shadow-md' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
              
              {isAdmin && (
                <button 
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 shadow-sm"
                  onClick={() => {
                    setEditingFaq(null);
                    setFaqForm({ category: 'VIDEO', question: '', answer: '', keywords: '' });
                    setShowFaqModal(true);
                  }}
                >
                  + FAQ 등록
                </button>
              )}
            </div>

            {/* 자주 찾는 질문 그리드 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 px-2">자주 찾는 도움말</h3>
              
              {faqLoading ? (
                <div className="text-center py-20 text-gray-500">로딩 중...</div>
              ) : faqs.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl text-gray-500 border border-dashed border-gray-300">
                  등록된 도움말이 없습니다.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* ★ 슬라이스: visibleCount 만큼만 보여줍니다 */}
                    {faqs.slice(0, visibleCount).map(faq => (
                      <div 
                        key={faq.id} 
                        className="group bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-gray-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between h-full min-h-[160px]"
                        onClick={() => handleFaqClick(faq.id)}
                      >
                        <div>
                          <div className="flex items-start gap-2 mb-3">
                            <span className="font-bold text-slate-900 text-lg leading-tight">Q.</span>
                            <span className="font-bold text-gray-800 leading-tight group-hover:underline decoration-2 underline-offset-4 line-clamp-3">
                              {faq.question}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">
                            #{faq.categoryName}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ★ 더보기 버튼: 남은 FAQ가 있을 때만 표시 */}
                  {visibleCount < faqs.length && (
                    <div className="mt-10 text-center">
                      <button 
                        onClick={handleLoadMore}
                        className="px-10 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm flex items-center gap-2 mx-auto"
                      >
                        <span>+ 도움말 더보기</span>
                        <span className="text-xs text-gray-400">({Math.min(visibleCount + 8, faqs.length)}/{faqs.length})</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 하단 액션 버튼 (챗봇, 문의하기) */}
            <div className="pt-12 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 px-2">다른 도움이 필요하신가요?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. 챗봇 상담 카드 */}
                <div 
                  onClick={() => setActiveTab('qa')}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-8 cursor-pointer transition-colors shadow-lg flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    {/* ★ 이모티콘 대신 이미지 사용 */}
                    {chatIcon ? (
                      <img src={chatIcon} alt="Chat Icon" className="w-16 h-16 rounded-full object-cover invert" />
                    ) : (
                      <span className="text-5xl">🤖</span> 
                    )}
                    <div>
                      <h4 className="text-xl font-bold mb-1">AI 챗봇 상담</h4>
                      <p className="text-slate-300 text-sm">
                        24시간 언제든지<br/>궁금한 점을 물어보세요.
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-700 group-hover:bg-slate-600 p-3 rounded-full transition-colors">
                    <span className="text-xl">➜</span>
                  </div>
                </div>

                {/* 2. 1:1 문의 카드 */}
                <div 
                  onClick={() => setActiveTab(isAdmin ? 'inquiry-admin' : 'inquiry')}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl p-8 cursor-pointer transition-colors shadow-lg flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                     {/* ★ 이메일 아이콘 이미지 사용 */}
                     {emailIcon ? (
                       <img src={emailIcon} alt="Email Icon" className="w-16 h-16 rounded-full object-contain invert p-1" />
                     ) : (
                       <span className="text-5xl bg-white/10 rounded-full w-16 h-16 flex items-center justify-center grayscale brightness-200">📝</span>
                     )}
                    <div>
                      <h4 className="text-xl font-bold mb-1">{isAdmin ? '문의 관리' : '1:1 문의하기'}</h4>
                      <p className="text-slate-300 text-sm">
                        {isAdmin 
                          ? <>사용자 문의를 확인하고<br/>답변을 작성하세요.</>
                          : <>해결되지 않은 문제는<br/>직접 문의를 남겨주세요.</>}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-700 group-hover:bg-slate-600 p-3 rounded-full transition-colors">
                    <span className="text-xl">➜</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* --- 챗봇 화면 --- */}
        {activeTab === 'qa' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <BackButton /> {/* 뒤로가기 버튼 */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
              <div className="p-4 bg-slate-900 text-white font-medium flex items-center gap-3">
                 {/* 헤더에도 작은 아이콘 넣기 */}
                 {chatIcon && <img src={chatIcon} className="w-8 h-8 object-contain bg-white rounded-full p-1"/>}
                 <span>AI 상담원</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {chatIcon && <img src={chatIcon} className="w-20 h-20 object-contain mx-auto mb-4 opacity-50"/>}
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">안녕하세요!</h4>
                    <p>AI 상담원이 대기 중입니다.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                        ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {qaLoading && <div className="text-sm text-gray-500 px-4">답변 작성 중...</div>}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="메시지를 입력하세요..."
                  disabled={qaLoading}
                />
                <button onClick={handleSendMessage} disabled={!inputMessage.trim() || qaLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300">전송</button>
              </div>
            </div>
          </div>
        )}

        {/* --- 문의하기 화면 --- */}
        {(activeTab === 'inquiry' || activeTab === 'inquiry-admin') && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-end">
              <BackButton /> {/* 뒤로가기 버튼 */}
              {!activeTab.includes('admin') && (
                 <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm mb-6" onClick={() => setShowCreateModal(true)}>+ 1:1 문의 작성</button>
              )}
            </div>
            
            {/* 문의 내역 테이블 */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
               {/* ... (기존 테이블 코드 동일) ... */}
               <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-500">
                <div className="col-span-2 text-center">상태</div>
                <div className="col-span-1 text-center">분류</div>
                {activeTab === 'inquiry-admin' && <div className="col-span-2 text-center">작성자</div>}
                <div className={activeTab === 'inquiry-admin' ? 'col-span-4' : 'col-span-6'}>제목</div>
                <div className="col-span-3 text-right">작성일</div>
              </div>
              {inquiryLoading ? (
                <div className="text-center py-12 text-gray-500">로딩 중...</div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">문의 내역이 없습니다.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {inquiries.map(inquiry => (
                    <div 
                      key={inquiry.id} 
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer items-center"
                      onClick={() => activeTab === 'inquiry-admin' ? handleViewInquiryForAdmin(inquiry.id) : handleViewInquiry(inquiry.id)}
                    >
                      <div className="col-span-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold
                          ${inquiry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : inquiry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                          {inquiry.statusName}
                        </span>
                      </div>
                      <div className="col-span-1 text-center text-sm text-gray-500">{inquiry.categoryName || '-'}</div>
                      {activeTab === 'inquiry-admin' && (
                        <div className="col-span-2 text-center text-sm text-gray-700">
                          {inquiry.userNickname || inquiry.userEmail || '-'}
                        </div>
                      )}
                      <div className={activeTab === 'inquiry-admin' ? 'col-span-4' : 'col-span-6'}>
                        <div className="text-sm font-medium text-gray-900 truncate">{inquiry.title}</div>
                      </div>
                      <div className="col-span-3 text-right text-sm text-gray-500">{new Date(inquiry.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 모달 컴포넌트들 (FAQ 읽기, 문의 작성 등 - 기존 코드 유지) */}
      {readFaqModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setReadFaqModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white">
              <div>
                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold mb-2">{readFaqModal.categoryName}</span>
                <h3 className="text-xl font-bold text-gray-900">{readFaqModal.question}</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={() => setReadFaqModal(null)}>×</button>
            </div>
            <div className="px-8 py-8 prose max-w-none text-gray-700 whitespace-pre-wrap">{readFaqModal.answer}</div>
            {isAdmin && (
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded" onClick={() => openEditFaqModal(readFaqModal)}>수정</button>
                <button className="px-4 py-2 bg-red-50 text-red-600 rounded" onClick={() => handleDeleteFaq(readFaqModal.id)}>삭제</button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 문의 작성 및 상세 모달, FAQ 관리 모달은 기존 코드와 동일하므로 생략하지 않고 포함되어 있다고 가정합니다 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
           <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">문의 작성</h3>
              {/* 폼 내용 생략 (기존과 동일) */}
              <div className="space-y-4">
                  <select className="w-full border p-2 rounded" value={inquiryForm.category} onChange={e => setInquiryForm({...inquiryForm, category: e.target.value})}>
                      <option value="">카테고리 선택</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input type="text" className="w-full border p-2 rounded" placeholder="제목" value={inquiryForm.title} onChange={e => setInquiryForm({...inquiryForm, title: e.target.value})} />
                  <textarea className="w-full border p-2 rounded h-32" placeholder="내용" value={inquiryForm.content} onChange={e => setInquiryForm({...inquiryForm, content: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded">취소</button>
                  <button onClick={handleCreateInquiry} className="px-4 py-2 bg-slate-900 text-white rounded">등록</button>
              </div>
           </div>
        </div>
      )}
      
      {showDetailModal && selectedInquiry && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between mb-4">
                   <h3 className="text-xl font-bold">{selectedInquiry.title}</h3>
                   <button onClick={() => setShowDetailModal(false)}>×</button>
               </div>
               <div className="bg-gray-50 p-4 rounded mb-4 whitespace-pre-wrap">{selectedInquiry.content}</div>
               {/* 답변 영역 로직 (기존과 동일) */}
               {selectedInquiry.adminResponse ? (
                   <div className="bg-blue-50 p-4 rounded border border-blue-100">
                       <div className="font-bold mb-2">관리자 답변</div>
                       {selectedInquiry.adminResponse}
                   </div>
               ) : isAdmin ? (
                   <div>
                       <textarea className="w-full border p-2 rounded h-24 mb-2" value={adminResponse} onChange={e => setAdminResponse(e.target.value)} placeholder="답변 입력"/>
                       <button onClick={handleAdminResponse} className="w-full bg-blue-600 text-white py-2 rounded">답변 등록</button>
                   </div>
               ) : <div className="text-gray-500 text-center">답변 대기 중</div>}
            </div>
         </div>
      )}

      {showFaqModal && (
        // FAQ 등록 모달 (기존과 동일)
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowFaqModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
               <h3 className="font-bold text-lg mb-4">{editingFaq ? 'FAQ 수정' : 'FAQ 등록'}</h3>
               <div className="space-y-3">
                  <select className="w-full border p-2 rounded" value={faqForm.category} onChange={e => setFaqForm({...faqForm, category: e.target.value})}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <input className="w-full border p-2 rounded" placeholder="질문" value={faqForm.question} onChange={e => setFaqForm({...faqForm, question: e.target.value})} />
                  <textarea className="w-full border p-2 rounded h-24" placeholder="답변" value={faqForm.answer} onChange={e => setFaqForm({...faqForm, answer: e.target.value})} />
                  <input className="w-full border p-2 rounded" placeholder="키워드" value={faqForm.keywords} onChange={e => setFaqForm({...faqForm, keywords: e.target.value})} />
               </div>
               <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowFaqModal(false)} className="px-4 py-2 border rounded">취소</button>
                  <button onClick={handleSaveFaq} className="px-4 py-2 bg-slate-900 text-white rounded">저장</button>
               </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default SupportPage;