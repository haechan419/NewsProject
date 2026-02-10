import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../../api/aiApi';

const QUESTION_POOL = [
  // 0. [실시간 검색어] - 최상단에 추가
  "지금 뭐가 핫해?",
  "실시간 인기 검색어 알려줘",
  "요즘 뜨는 이슈가 뭐야?",
  
  // 1. [정치/사회]
  "지방선거 지지율",
  "대통령 지지율",
  "의대 증원 파업",
  "국민연금 개혁",
  "저출산 대책 발표",
  "전세 사기 특별법",
  "지하철 요금 인상",
  "최저임금 협상",
  "간호법 제정 논란",
  "촉법소년 연령 하향",
  "여가부 폐지 논의",
  "검수완박 헌재 판결",
  "장애인 이동권 시위",
  "학교 폭력 대책",
  "공무원 정년 연장",
  "부동산 종부세 완화",
  "교육부 수능 개편",

  // 2. [경제/증권]
  "한은 기준금리 동결",
  "삼성전자 실적 발표",
  "코스피 지수 급락",
  "비트코인 시세 폭등",
  "강남 아파트값 하락",
  "가계부채 최고치",
  "국제 유가 상승",
  "엔화 환율 전망",
  "무역수지 적자",
  "소상공인 대출 연장",
  "전기차 보조금 개편",
  "공공요금 인상",
  "반도체 수출 실적",
  "미국 연준 FOMC",
  "나스닥 마감 시황",
  "은행권 성과급 논란",

  // 3. [국제/외교]
  "우크라이나 휴전 협상",
  "이스라엘 전쟁 속보",
  "북한 미사일 발사",
  "미중 무역 갈등",
  "일본 오염수 방류",
  "대만 해협 긴장",
  "미국 대선 결과",
  "튀르키예 지진 피해",
  "유럽 난민 사태",
  "중국 경제 둔화",
  "한미일 정상회담",
  "러시아 추가 제재",
  "WHO 코로나 종식",
  "프랑스 연금 시위",

  // 4. [올림픽/스포츠] (2026.2 이슈)
  "밀라노 올림픽 개막",
  "쇼트트랙 금메달",
  "스피드스케이팅 중계",
  "올림픽 종합 순위",
  "프로야구 개막전",
  "월드컵 예선 결과",
  "아시안게임 유치",
  "e스포츠 롤드컵",
  "K리그 개막",

  // 5. [사건/사고/날씨]
  "초미세먼지 주의보",
  "태풍 예상 경로",
  "장마철 집중 호우",
  "폭염 특보 발령",
  "대형 산불 진화",
  "묻지마 범죄 검거",
  "마약 사범 구속",
  "보이스피싱 주의",
  "조류 독감 확산",
  "층간소음 흉기난동",
  "음주운전 처벌 강화",
  "아동학대 어린이집",
  "식중독 집단 감염",
  "고속도로 추돌 사고",
  "개인정보 유출",

  // 6. [IT/과학]
  "갤럭시 S26 출시",
  "아이폰 17 유출",
  "누리호 발사 성공",
  "챗GPT 5.0 공개",
  "6G 통신 상용화",
  "카카오 먹통 사태",
  "애플페이 교통카드",
  "메타버스 이용자",
  "자율주행차 사고",
  "딥페이크 처벌",
  "가상화폐 규제",
  "달 탐사선 도착",
  "신종 해킹 수법",
  "AI 로봇 도입",
  "유튜브 접속 장애"
];
 

  

const FloatingAI = () => {
  // ===== 상태 관리 =====
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [randomSuggestions, setRandomSuggestions] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ===== 스크롤 자동 이동 =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ===== 창 열릴 때 랜덤 질문 생성 및 포커스 =====
  useEffect(() => {
    if (isOpen) {
      const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
      setRandomSuggestions(shuffled.slice(0, 5));
      
      // 약간의 지연 후 포커스 (애니메이션 고려)
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ===== 메시지 전송 로직 =====
  const handleSend = async (text = null) => {
    const messageToSend = text || inputValue;
    const trimmedInput = messageToSend.trim();
    
    if (!trimmedInput || isLoading) return;

    const userMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role, content: msg.content
      }));

      const response = await sendChatMessage(trimmedInput, conversationHistory);

      const assistantMessage = {
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
        sources: response.sources,
        // 실시간 검색어 관련 필드 추가 (Spring Boot는 camelCase로 직렬화)
        isTrending: response.isTrending || false,
        trendingData: response.trendingData || null
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
<<<<<<< HEAD
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다.',
=======
      console.error('채팅 에러:', error);
      
      // 에러 메시지 추가
      const errorMessage = {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
>>>>>>> a946f6f6b18974710cc396ee87547a607e4cf163
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const linkifyText = (text) => {
    if (!text) return text;
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    return text.split(urlPattern).map((part, idx) => {
      if (urlPattern.test(part)) {
        let url = part.startsWith('http') ? part : `https://${part}`;
        return <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">{part}</a>;
      }
      return part;
    });
  };

  return (
    <>
      {/* ===== 플로팅 버튼 ===== */}
      <button 
        className={`fixed bottom-[30px] right-[30px] w-[60px] h-[60px] rounded-full bg-[#3e5c46] border-none cursor-pointer flex items-center justify-center shadow-lg hover:scale-110 hover:bg-[#2c4232] transition-all duration-300 z-[9999] group`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI 비서"
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-[#5eff5e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg className="w-7 h-7 text-[#5eff5e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* ===== 채팅창 컨테이너 ===== */}
      {isOpen && (
        <div className="fixed bottom-[100px] right-[30px] w-[calc(100vw-40px)] max-w-[600px] h-[700px] max-h-[70vh] bg-white rounded-[20px] shadow-2xl z-[9998] flex flex-col overflow-hidden border border-gray-100 font-sans animate-fade-in-up">
          
          {/* 헤더 */}
          <div className="bg-[#3e5c46] text-white p-4 flex justify-between items-center">
            <h3 className="m-0 text-lg font-semibold flex items-center gap-2">
              AI 비서
            </h3>
            <button 
              className="bg-transparent border-none text-[#5eff5e] cursor-pointer p-1 rounded hover:bg-white/10 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#fcfcfc]">
            {messages.length === 0 ? (
              // 웰컴 메시지 & 추천 질문
              <div className="flex flex-col items-center mt-5 w-full">
                <div className="text-center text-gray-600 mb-6">
                  <h4 className="text-xl text-[#3e5c46] font-bold mb-2">무엇을 도와드릴까요?</h4>
                  <p className="text-sm text-gray-400">궁금한 내용을 물어보시면<br/>AI가 실시간 정보를 검색해서 알려드립니다.</p>
                </div>
                
                <div className="flex flex-col gap-2 w-full">
                  {randomSuggestions.map((question, idx) => (
                    <button 
                      key={idx} 
                      className="bg-white border border-gray-200 p-3 rounded-xl text-left text-sm text-gray-800 cursor-pointer flex justify-between items-center shadow-sm hover:border-[#3e5c46] hover:bg-[#f0fdf4] hover:-translate-y-0.5 hover:shadow transition-all duration-200"
                      onClick={() => handleSend(question)}
                    >
                      <span className="font-medium">{question}</span>
                      <svg className="w-4 h-4 text-[#3e5c46]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // 대화 내용
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed break-words shadow-sm
                    ${msg.role === 'user' 
                      ? 'self-end bg-[#3e5c46] text-white rounded-br-sm' 
                      : msg.isError 
                        ? 'self-start bg-red-50 text-red-600 border border-red-100'
                        : 'self-start bg-[#dceddd] text-gray-800 rounded-bl-sm'
                    }`}
                >
                  {/* 실시간 검색어 메시지 특별 렌더링 */}
                  {msg.role === 'assistant' && msg.isTrending && msg.trendingData ? (
                    <div className="trending-message">
                      {/* 헤더 */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-black/10">
                        <span className="text-xl">🔥</span>
                        <span className="font-bold text-[#3e5c46]">실시간 인기 검색어</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {msg.trendingData.updatedAt 
                            ? new Date(msg.trendingData.updatedAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'})
                            : '방금'
                          } 기준
                        </span>
                      </div>
                      
                      {/* 키워드 태그들 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {msg.trendingData.keywords.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(`${item.keyword}에 대해 알려줘`)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer transition-all hover:bg-[#3e5c46] hover:text-white hover:border-[#3e5c46] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="text-xs text-gray-400 font-bold">{item.rank}</span>
                            <span>{item.keyword}</span>
                            {item.state === 'n' && <span className="text-[10px] bg-red-500 text-white px-1 rounded">NEW</span>}
                            {item.state === '+' && <span className="text-[10px] text-green-600">▲</span>}
                          </button>
                        ))}
                      </div>
                      
                      {/* 안내 메시지 */}
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span>💡</span>
                        <span>궁금한 키워드를 클릭하면 자세한 정보를 검색해드려요!</span>
                      </p>
                    </div>
                  ) : (
                    // 일반 메시지 렌더링
                    <div className="whitespace-pre-wrap">
                      {linkifyText(msg.content)}
                    </div>
                  )}
                  
                  {/* 검색 출처 */}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-black/5">
                      <div className="text-xs font-bold text-[#3e5c46] mb-1.5 flex items-center gap-1">
                        <span>🔗 관련 출처</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {msg.sources.map((source, idx) => (
                          <a 
                            key={idx} 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block text-xs text-gray-600 bg-white/60 px-2.5 py-1.5 rounded-md border border-black/5 truncate hover:bg-white hover:text-[#3e5c46] hover:border-[#3e5c46] transition-colors decoration-0"
                          >
                            {source.title || source.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="self-start bg-[#dceddd] px-4 py-3 rounded-2xl rounded-bl-sm flex flex-col gap-2 items-start">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-[#3e5c46] rounded-full animate-bounce [animation-delay:-0.32s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#3e5c46] rounded-full animate-bounce [animation-delay:-0.16s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#3e5c46] rounded-full animate-bounce"></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">AI가 열심히 검색중입니다!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="p-4 bg-white border-t border-gray-100 flex gap-2.5 items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              disabled={isLoading}
              className="flex-1 p-3 border border-gray-200 rounded-full text-sm bg-[#f9f9f9] outline-none transition-colors focus:border-[#3e5c46] focus:bg-white disabled:bg-gray-100"
            />
            <button 
              className="w-11 h-11 rounded-full bg-[#3e5c46] border-none cursor-pointer flex items-center justify-center transition-all hover:bg-[#2c4232] hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
            >
              <svg className="w-5 h-5 text-[#5eff5e] ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAI;