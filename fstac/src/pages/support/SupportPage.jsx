// SupportPage.jsx - 고객센터 메인 페이지
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getFaqs, clickFaq, searchFaqs, createFaq, updateFaq, deleteFaq } from '../../api/faqApi';
import { sendQaMessage, getQaHistory } from '../../api/qaApi';
import { getMyInquiries, createInquiry, getInquiryById, getAllInquiries, updateInquiry } from '../../api/inquiryApi';
import apiClient from '../../api/axios';
import './SupportPage.css';

// 카테고리 정보
const CATEGORIES = [
  { value: 'VIDEO', label: '영상제작' },
  { value: 'POST', label: '게시물작성' },
  { value: 'ACCOUNT', label: '프로필/계정' },
  { value: 'ETC', label: '기타' }
];

const SupportPage = () => {
  // Redux에서 사용자 정보 가져오기
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.roles?.includes('ADMIN') || user?.memberRoleList?.includes('ADMIN');

  // 상태 관리
  const [activeTab, setActiveTab] = useState('faq'); // faq, qa, inquiry
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // FAQ 상태
  const [faqs, setFaqs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [faqLoading, setFaqLoading] = useState(false);

  // Q&A 챗봇 상태
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [qaLoading, setQaLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 문의 티켓 상태
  const [inquiries, setInquiries] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({ title: '', content: '', category: '' });
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // FAQ 관리자 모달 상태
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ category: 'VIDEO', question: '', answer: '', keywords: '' });

  // 관리자 답변 상태
  const [adminResponse, setAdminResponse] = useState('');

  // CSRF 토큰 가져오기 (컴포넌트 마운트 시)
  useEffect(() => {
    // CSRF 토큰을 받기 위해 인증이 필요 없는 GET 요청 사용
    // /api/category/list는 permitAll로 설정되어 있어 CSRF 토큰을 받을 수 있음
    apiClient.get('/api/category/list')
      .catch(() => {
        // CSRF 토큰만 받으면 되므로 에러는 무시
      });
  }, []);

  // FAQ 목록 로드
  useEffect(() => {
    loadFaqs();
  }, [selectedCategory]);

  // 문의 목록 로드
  useEffect(() => {
    if (activeTab === 'inquiry') {
      loadInquiries();
    }
  }, [activeTab, isAdminMode]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadFaqs = async () => {
    setFaqLoading(true);
    try {
      const data = await getFaqs(selectedCategory);
      setFaqs(data);
    } catch (error) {
      console.error('FAQ 로드 실패:', error);
    } finally {
      setFaqLoading(false);
    }
  };

  const loadInquiries = async () => {
    setInquiryLoading(true);
    try {
      const data = isAdminMode ? await getAllInquiries() : await getMyInquiries();
      setInquiries(data);
    } catch (error) {
      console.error('문의 로드 실패:', error);
    } finally {
      setInquiryLoading(false);
    }
  };

  // FAQ 클릭 핸들러
  const handleFaqClick = async (faqId) => {
    if (expandedFaq === faqId) {
      setExpandedFaq(null);
    } else {
      try {
        const faq = await clickFaq(faqId);
        setExpandedFaq(faqId);
        // FAQ 목록 업데이트 (조회수 반영)
        setFaqs(prev => prev.map(f => f.id === faqId ? faq : f));
      } catch (error) {
        console.error('FAQ 클릭 실패:', error);
      }
    }
  };

  // Q&A 메시지 전송
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || qaLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setQaLoading(true);

    try {
      const conversationHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendQaMessage(userMessage, sessionId, conversationHistory);
      
      setSessionId(response.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      console.error('Q&A 메시지 전송 실패:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
      }]);
    } finally {
      setQaLoading(false);
    }
  };

  // 문의 생성
  const handleCreateInquiry = async () => {
    if (!inquiryForm.title.trim() || !inquiryForm.content.trim()) return;

    try {
      await createInquiry({
        ...inquiryForm,
        category: inquiryForm.category || null
      });
      setShowCreateModal(false);
      setInquiryForm({ title: '', content: '', category: '' });
      loadInquiries();
      alert('문의가 등록되었습니다.');
    } catch (error) {
      console.error('문의 생성 실패:', error);
      alert('문의 등록에 실패했습니다.');
    }
  };

  // 문의 상세 보기
  const handleViewInquiry = async (inquiryId) => {
    try {
      const data = isAdminMode 
        ? await getAllInquiries().then(list => list.find(i => i.id === inquiryId))
        : await getInquiryById(inquiryId);
      setSelectedInquiry(data);
      setAdminResponse(data.adminResponse || '');
      setShowDetailModal(true);
    } catch (error) {
      console.error('문의 조회 실패:', error);
    }
  };

  // 관리자 답변 제출
  const handleAdminResponse = async () => {
    if (!adminResponse.trim()) return;

    try {
      await updateInquiry(selectedInquiry.id, {
        status: 'COMPLETED',
        adminResponse: adminResponse
      });
      setShowDetailModal(false);
      loadInquiries();
      alert('답변이 등록되었습니다.');
    } catch (error) {
      console.error('답변 등록 실패:', error);
      alert('답변 등록에 실패했습니다.');
    }
  };

  // FAQ 생성/수정 (관리자)
  const handleSaveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;

    try {
      if (editingFaq) {
        await updateFaq(editingFaq.id, faqForm);
      } else {
        await createFaq(faqForm);
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqForm({ category: 'VIDEO', question: '', answer: '', keywords: '' });
      loadFaqs();
      alert(editingFaq ? 'FAQ가 수정되었습니다.' : 'FAQ가 등록되었습니다.');
    } catch (error) {
      console.error('FAQ 저장 실패:', error);
      alert('FAQ 저장에 실패했습니다.');
    }
  };

  // FAQ 삭제 (관리자)
  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await deleteFaq(faqId);
      loadFaqs();
      alert('FAQ가 삭제되었습니다.');
    } catch (error) {
      console.error('FAQ 삭제 실패:', error);
      alert('FAQ 삭제에 실패했습니다.');
    }
  };

  // FAQ 수정 모달 열기
  const openEditFaqModal = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords || ''
    });
    setShowFaqModal(true);
  };

  return (
    <div className="support-page">
      {/* 헤더 */}
      <div className="support-header">
        <h1>🎧 고객센터</h1>
        
        {/* 관리자 토글 (ADMIN만 표시) */}
        {isAdmin && (
          <div className="admin-toggle">
            <button 
              className={!isAdminMode ? 'active' : ''} 
              onClick={() => setIsAdminMode(false)}
            >
              일반 페이지
            </button>
            <button 
              className={isAdminMode ? 'active' : ''} 
              onClick={() => setIsAdminMode(true)}
            >
              관리자 페이지
            </button>
          </div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="support-tabs">
        <button 
          className={activeTab === 'faq' ? 'active' : ''} 
          onClick={() => setActiveTab('faq')}
        >
          FAQ
        </button>
        <button 
          className={activeTab === 'qa' ? 'active' : ''} 
          onClick={() => setActiveTab('qa')}
        >
          Q&A 챗봇
        </button>
        <button 
          className={activeTab === 'inquiry' ? 'active' : ''} 
          onClick={() => setActiveTab('inquiry')}
        >
          문의하기
        </button>
      </div>

      {/* FAQ 탭 */}
      {activeTab === 'faq' && (
        <div className="faq-section">
          {/* 카테고리 버튼 */}
          <div className="faq-categories">
            <button 
              className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              전체
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.value}
                className={`category-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 관리자: FAQ 추가 버튼 */}
          {isAdminMode && (
            <button 
              className="create-inquiry-btn" 
              style={{ marginBottom: '20px' }}
              onClick={() => {
                setEditingFaq(null);
                setFaqForm({ category: 'VIDEO', question: '', answer: '', keywords: '' });
                setShowFaqModal(true);
              }}
            >
              + FAQ 추가
            </button>
          )}

          {/* FAQ 목록 */}
          <div className="faq-list">
            {faqLoading ? (
              <p style={{ textAlign: 'center', color: '#718096' }}>로딩 중...</p>
            ) : faqs.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#718096' }}>등록된 FAQ가 없습니다.</p>
            ) : (
              faqs.map(faq => (
                <div key={faq.id} className="faq-item">
                  <div className="faq-question" onClick={() => handleFaqClick(faq.id)}>
                    <div>
                      <span className="category-tag">{faq.categoryName}</span>
                      {faq.question}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isAdminMode && (
                        <div className="admin-actions" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEditFaqModal(faq)}>수정</button>
                          <button className="delete" onClick={() => handleDeleteFaq(faq.id)}>삭제</button>
                        </div>
                      )}
                      <span className={`arrow ${expandedFaq === faq.id ? 'open' : ''}`}>▼</span>
                    </div>
                  </div>
                  {expandedFaq === faq.id && (
                    <div className="faq-answer">{faq.answer}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Q&A 챗봇 탭 */}
      {activeTab === 'qa' && (
        <div className="qa-section">
          <div className="qa-chat-container">
            <div className="qa-chat-header">
              🤖 AI 상담원 (HyperCLOVA)
            </div>
            
            <div className="qa-chat-messages">
              {messages.length === 0 ? (
                <div className="qa-welcome">
                  <h4>안녕하세요! 👋</h4>
                  <p>무엇이든 물어보세요.<br />AI 상담원이 도와드립니다.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`qa-message ${msg.role}`}>
                    {msg.content}
                  </div>
                ))
              )}
              
              {qaLoading && (
                <div className="qa-message assistant loading">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="qa-chat-input">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="질문을 입력하세요..."
                disabled={qaLoading}
              />
              <button onClick={handleSendMessage} disabled={!inputMessage.trim() || qaLoading}>
                전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 문의하기 탭 */}
      {activeTab === 'inquiry' && (
        <div className="inquiry-section">
          <div className="inquiry-header">
            <h3>{isAdminMode ? '전체 문의 목록' : '내 문의 내역'}</h3>
            {!isAdminMode && (
              <button className="create-inquiry-btn" onClick={() => setShowCreateModal(true)}>
                + 문의 작성
              </button>
            )}
          </div>

          <div className="inquiry-list">
            {inquiryLoading ? (
              <p style={{ textAlign: 'center', color: '#718096' }}>로딩 중...</p>
            ) : inquiries.length === 0 ? (
              <div className="no-inquiries">
                <p>등록된 문의가 없습니다.</p>
              </div>
            ) : (
              inquiries.map(inquiry => (
                <div 
                  key={inquiry.id} 
                  className="inquiry-item"
                  onClick={() => handleViewInquiry(inquiry.id)}
                >
                  <div className="inquiry-info">
                    <h4>{inquiry.title}</h4>
                    <p>
                      {isAdminMode && `${inquiry.userNickname} · `}
                      {new Date(inquiry.createdAt).toLocaleDateString()}
                      {inquiry.categoryName && ` · ${inquiry.categoryName}`}
                    </p>
                  </div>
                  <span className={`inquiry-status ${inquiry.status}`}>
                    {inquiry.statusName}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 문의 작성 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>문의 작성</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>카테고리</label>
                <select 
                  value={inquiryForm.category} 
                  onChange={(e) => setInquiryForm({ ...inquiryForm, category: e.target.value })}
                >
                  <option value="">선택 안함</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>제목 *</label>
                <input 
                  type="text" 
                  value={inquiryForm.title}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, title: e.target.value })}
                  placeholder="문의 제목을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>내용 *</label>
                <textarea 
                  value={inquiryForm.content}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, content: e.target.value })}
                  placeholder="문의 내용을 상세히 작성해주세요"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>취소</button>
              <button 
                className="btn-submit" 
                onClick={handleCreateInquiry}
                disabled={!inquiryForm.title.trim() || !inquiryForm.content.trim()}
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 문의 상세 모달 */}
      {showDetailModal && selectedInquiry && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>문의 상세</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="inquiry-detail">
              <div className="inquiry-detail-header">
                <span className={`inquiry-status ${selectedInquiry.status}`}>
                  {selectedInquiry.statusName}
                </span>
                <h4>{selectedInquiry.title}</h4>
                <p className="inquiry-detail-meta">
                  {isAdminMode && `${selectedInquiry.userNickname} · `}
                  {new Date(selectedInquiry.createdAt).toLocaleString()}
                  {selectedInquiry.categoryName && ` · ${selectedInquiry.categoryName}`}
                </p>
              </div>
              
              <div className="inquiry-detail-content">
                {selectedInquiry.content}
              </div>

              {/* 관리자 답변 */}
              {selectedInquiry.adminResponse && (
                <div className="inquiry-response">
                  <h5>📝 관리자 답변</h5>
                  <p>{selectedInquiry.adminResponse}</p>
                </div>
              )}

              {/* 관리자 답변 입력 (관리자 모드 + 미완료 상태) */}
              {isAdminMode && selectedInquiry.status !== 'COMPLETED' && (
                <div className="inquiry-response">
                  <h5>답변 작성</h5>
                  <div className="form-group">
                    <textarea 
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="답변을 입력하세요"
                    />
                  </div>
                  <button 
                    className="btn-submit" 
                    onClick={handleAdminResponse}
                    disabled={!adminResponse.trim()}
                  >
                    답변 등록
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAQ 생성/수정 모달 (관리자) */}
      {showFaqModal && (
        <div className="modal-overlay" onClick={() => setShowFaqModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingFaq ? 'FAQ 수정' : 'FAQ 추가'}</h3>
              <button className="modal-close" onClick={() => setShowFaqModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>카테고리 *</label>
                <select 
                  value={faqForm.category} 
                  onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>질문 *</label>
                <input 
                  type="text" 
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                  placeholder="질문을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>답변 *</label>
                <textarea 
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                  placeholder="답변을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>검색 키워드 (쉼표로 구분)</label>
                <input 
                  type="text" 
                  value={faqForm.keywords}
                  onChange={(e) => setFaqForm({ ...faqForm, keywords: e.target.value })}
                  placeholder="예: 영상, 제작, 시간"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowFaqModal(false)}>취소</button>
              <button 
                className="btn-submit" 
                onClick={handleSaveFaq}
                disabled={!faqForm.question.trim() || !faqForm.answer.trim()}
              >
                {editingFaq ? '수정' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
