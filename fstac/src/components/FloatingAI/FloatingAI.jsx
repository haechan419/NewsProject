// FloatingAI.jsx - 둥둥 떠있는 AI 챗봇 컴포넌트
import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../api/aiApi';
import './FloatingAI.css';

const FloatingAI = () => {
  // ===== 상태 관리 =====
  const [isOpen, setIsOpen] = useState(false);           // 채팅창 열림/닫힘
  const [messages, setMessages] = useState([]);          // 메시지 목록
  const [inputValue, setInputValue] = useState('');      // 입력값
  const [isLoading, setIsLoading] = useState(false);     // 로딩 상태
  
  // 메시지 영역 스크롤을 위한 ref
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ===== 메시지 추가 시 자동 스크롤 =====
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 채팅창 열릴 때 입력창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ===== 채팅창 토글 =====
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // ===== 메시지 전송 =====
  const handleSend = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // 사용자 메시지 추가
    const userMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 대화 히스토리 준비 (최근 10개만)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // API 호출
      const response = await sendChatMessage(trimmedInput, conversationHistory);

      // AI 응답 추가
      const assistantMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('채팅 에러:', error);
      console.error('에러 상세:', error.originalError);
      console.error('에러 메시지:', error.message);
      
      // 에러 메시지 추가 (서버에서 받은 에러 메시지 사용)
      const errorMessage = {
        role: 'assistant',
        content: error.message || '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 엔터키 전송 =====
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ===== 렌더링 =====
  return (
    <>
      {/* 플로팅 버튼 (항상 표시) */}
      <button 
        className="floating-ai-button" 
        onClick={toggleChat}
        title="AI 챗봇"
      >
        {isOpen ? (
          // X 아이콘 (닫기)
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          // 채팅 아이콘
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>

      {/* 채팅창 */}
      {isOpen && (
        <div className="floating-ai-chat">
          {/* 헤더 */}
          <div className="chat-header">
            <h3>🤖 AI 어시스턴트</h3>
            <button className="chat-header-close" onClick={toggleChat}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h4>안녕하세요! 👋</h4>
                <p>무엇이든 물어보세요.<br />AI가 도와드립니다.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}
                >
                  {msg.content}
                </div>
              ))
            )}
            
            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="message assistant loading">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
              </div>
            )}
            
            {/* 스크롤 앵커 */}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
            />
            <button 
              className="chat-send-button" 
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAI;
