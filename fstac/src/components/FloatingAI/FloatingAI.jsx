import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage, getTrendingKeywords } from '../../api/aiApi';
import lampIcon from '../../assets/images/lamp.png';
import sendmailIcon from '../../assets/images/sendmail.png';
import runGif from '../../assets/images/run.gif';

// 추천 질문 풀
const QUESTION_POOL = [
  // 0. [실시간 검색어]
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

  // 4. [올림픽/스포츠]
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
  
  // 실시간 검색어 상태
  const [trendingKeywords, setTrendingKeywords] = useState([]);
  const [trendingUpdatedAt, setTrendingUpdatedAt] = useState(null);
  const [trendingLoading, setTrendingLoading] = useState(false);
  
  // 추천 질문 상태 (응답 후 표시)
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ===== 스크롤 자동 이동 =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, suggestedQuestions]);

  // ===== 실시간 검색어 로드 =====
  const loadTrendingKeywords = async () => {
    setTrendingLoading(true);
    try {
      const data = await getTrendingKeywords();
      if (data?.keywords) {
        setTrendingKeywords(data.keywords);
        setTrendingUpdatedAt(data.updated_at);
      }
    } catch (error) {
      console.error('실시간 검색어 로드 실패:', error);
    } finally {
      setTrendingLoading(false);
    }
  };

  // ===== 랜덤 추천 질문 생성 =====
  const generateSuggestedQuestions = () => {
    const shuffled = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
    setSuggestedQuestions(shuffled.slice(0, 5));
  };

  // ===== 창 열릴 때 실시간 검색어 로드 및 포커스 =====
  useEffect(() => {
    if (isOpen) {
      loadTrendingKeywords();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ===== 메시지 전송 로직 =====
  const handleSend = async (text = null) => {
    const messageToSend = text || inputValue;
    const trimmedInput = messageToSend.trim();
    
    if (!trimmedInput || isLoading) return;

    // 추천 질문 초기화
    setSuggestedQuestions([]);

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
        isTrending: response.isTrending || false,
        trendingData: response.trendingData || null
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // 응답 후 추천 질문 생성 (실시간 검색어 응답이 아닌 경우)
      if (!response.isTrending) {
        generateSuggestedQuestions();
      }
      
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다.',
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

  // ===== 시간 포맷 =====
  const formatTime = (dateString) => {
    if (!dateString) return '방금';
    try {
      return new Date(dateString).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});
    } catch {
      return '방금';
    }
  };

  return (
    <>
      {/* 종이비행기 애니메이션 스타일 */}
      <style>{`
        @keyframes flyAway {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          50% { transform: translate(12px, -12px) rotate(360deg) scale(0.8); opacity: 0.5; }
          60% { transform: translate(20px, -20px) rotate(400deg) scale(0.3); opacity: 0; }
          61% { transform: translate(-15px, 15px) rotate(0deg) scale(0.3); opacity: 0; }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
        }
        .send-btn-container:not(:disabled):hover .send-icon {
          animation: flyAway 0.8s ease-in-out;
        }
      `}</style>

      {/* ===== 플로팅 버튼 ===== */}
      <button 
        className={`fixed bottom-[30px] right-[130px] w-[60px] h-[60px] rounded-full bg-[#3e5c46] border-none cursor-pointer flex items-center justify-center shadow-lg hover:scale-110 hover:bg-[#2c4232] transition-all duration-300 z-[9999] group`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI 비서"
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-[#5eff5e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg className="w-7 h-7 text-[#5eff5e] -scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* ===== 채팅창 컨테이너 ===== */}
      {isOpen && (
        <div className="fixed bottom-[100px] right-[130px] w-[calc(100vw-40px)] max-w-[700px] h-[750px] max-h-[75vh] bg-white rounded-[20px] shadow-2xl z-[9998] flex flex-col overflow-hidden border border-gray-100 font-sans animate-fade-in-up">
          
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
              // ===== 웰컴 메시지 & 실시간 검색어 =====
              <div className="flex flex-col items-center mt-5 w-full">
                <div className="text-center text-gray-600 mb-6">
                  <h4 className="text-xl text-[#3e5c46] font-bold mb-2">무엇을 도와드릴까요?</h4>
                  <p className="text-sm text-gray-400">궁금한 내용을 물어보시면<br/>AI가 실시간 정보를 검색해서 알려드립니다.</p>
                </div>
                
                {/* 실시간 검색어 섹션 */}
                <div className="w-full bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#ef4444" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                    <span className="font-bold text-[#3e5c46]">실시간 검색어</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {trendingUpdatedAt ? formatTime(trendingUpdatedAt) : ''} 기준
                    </span>
                  </div>
                  
                  {trendingLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#3e5c46] rounded-full animate-bounce [animation-delay:-0.32s]"></div>
                        <div className="w-2 h-2 bg-[#3e5c46] rounded-full animate-bounce [animation-delay:-0.16s]"></div>
                        <div className="w-2 h-2 bg-[#3e5c46] rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  ) : trendingKeywords.length > 0 ? (
                    <>
                      {/* 키워드 버튼들 - 가로 나열 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {trendingKeywords.slice(0, 10).map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(`${item.keyword}에 대해 알려줘`)}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer transition-all hover:bg-[#3e5c46] hover:text-white hover:border-[#3e5c46] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            <span className="text-xs text-gray-400 font-bold min-w-[16px]">{item.rank}</span>
                            <span>{item.keyword}</span>
                            {item.state === 'n' && <span className="text-[10px] bg-red-500 text-white px-1 rounded ml-1">NEW</span>}
                            {item.state === '+' && <span className="text-[10px] text-green-600">▲</span>}
                          </button>
                        ))}
                      </div>
                      
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <img src={lampIcon} alt="lamp" className="w-5 h-5 object-contain mix-blend-multiply" />
                        <span>궁금한 키워드를 클릭하면 자세한 정보를 검색해드려요!</span>
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      실시간 검색어를 불러오는 중...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // ===== 대화 내용 =====
              <>
                {messages.map((msg, index) => (
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
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-black/10">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#ef4444" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                          </svg>
                          <span className="font-bold text-[#3e5c46]">실시간 인기 검색어</span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatTime(msg.trendingData.updatedAt)} 기준
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {msg.trendingData.keywords.map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(`${item.keyword}에 대해 알려줘`)}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 cursor-pointer transition-all hover:bg-[#3e5c46] hover:text-white hover:border-[#3e5c46] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              <span className="text-xs text-gray-400 font-bold">{item.rank}</span>
                              <span>{item.keyword}</span>
                              {item.state === 'n' && <span className="text-[10px] bg-red-500 text-white px-1 rounded">NEW</span>}
                              {item.state === '+' && <span className="text-[10px] text-green-600">▲</span>}
                            </button>
                          ))}
                        </div>
                        
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span>💡</span>
                          <span>궁금한 키워드를 클릭하면 자세한 정보를 검색해드려요!</span>
                        </p>
                      </div>
                    ) : (
                      // 일반 메시지 렌더링 (마크다운)
                      <div className="ai-markdown-content text-[15px]">
                        <ReactMarkdown
                          components={{
                            // 헤딩 스타일
                            h1: ({node, ...props}) => <h1 className="text-lg font-bold text-[#2d4a32] mb-2 mt-3 first:mt-0" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-base font-bold text-[#2d4a32] mb-2 mt-3 first:mt-0" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-bold text-[#2d4a32] mb-1.5 mt-2 first:mt-0" {...props} />,
                            // 굵은 글씨 스타일
                            strong: ({node, ...props}) => <strong className="font-bold text-[#1a3d1f]" {...props} />,
                            // 기울임 스타일
                            em: ({node, ...props}) => <em className="italic text-gray-600" {...props} />,
                            // 리스트 스타일
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1.5 my-2" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1.5 my-2" {...props} />,
                            li: ({node, ...props}) => <li className="leading-relaxed pl-1" {...props} />,
                            // 문단 스타일
                            p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-[1.7]" {...props} />,
                            // 링크 스타일
                            a: ({node, ...props}) => <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer" {...props} />,
                            // 인용문 스타일
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#3e5c46] pl-3 my-2 text-gray-600 italic bg-gray-50 py-1 rounded-r" {...props} />,
                            // 코드 스타일
                            code: ({node, inline, ...props}) => 
                              inline 
                                ? <code className="bg-gray-100 text-[#c7254e] px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
                                : <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg text-sm font-mono my-2 overflow-x-auto" {...props} />,
                            // 구분선 스타일
                            hr: ({node, ...props}) => <hr className="my-3 border-gray-200" {...props} />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
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
                ))}
                
                {/* ===== 추천 질문 (채팅 버블 밖에 표시) ===== */}
                {!isLoading && suggestedQuestions.length > 0 && (
                  <div className="mt-1 px-2.5 py-2 bg-white rounded-lg border border-gray-200 shadow-sm max-w-[85%] self-start">
                    <div className="text-xs font-bold text-[#3e5c46] mb-1.5 flex items-center gap-1">
                      <img src={lampIcon} alt="lamp" className="w-5 h-5 object-contain mix-blend-multiply" />
                      <span>이런 질문은 어떠세요?</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(question)}
                          disabled={isLoading}
                          className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-700 cursor-pointer transition-all hover:bg-[#3e5c46] hover:text-white hover:border-[#3e5c46] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* 로딩 인디케이터 */}
            {isLoading && (
              <div className="self-start bg-[#dceddd] px-4 py-3 rounded-2xl rounded-bl-sm flex flex-col gap-2 items-start">
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-[#3e5c46] rounded-full animate-bounce [animation-delay:-0.32s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#3e5c46] rounded-full animate-bounce [animation-delay:-0.16s]"></div>
                    <div className="w-1.5 h-1.5 bg-[#3e5c46] rounded-full animate-bounce"></div>
                  </div>
                  <img src={runGif} alt="running" className="w-8 h-8 object-contain" />
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
              className="send-btn-container w-11 h-11 rounded-full bg-[#3e5c46] border-none cursor-pointer flex items-center justify-center transition-all hover:bg-[#2c4232] hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isLoading}
            >
              <img 
                src={sendmailIcon} 
                alt="send" 
                className="send-icon w-6 h-6 object-contain brightness-0 invert" 
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAI;
