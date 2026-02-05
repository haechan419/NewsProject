# search_service.py
from openai import OpenAI
from tavily import TavilyClient
from typing import Optional, List, Dict, Any
import logging
import json
import os
from datetime import datetime, timedelta
import re

# 로거 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SearchService:
    """AI 웹 검색 서비스 클래스 (Tavily API 사용)"""
    
    def __init__(self, openai_client: OpenAI, tavily_api_key: str = None):
        self.client = openai_client
        
        # Tavily API 키 설정 및 디버깅 로그
        api_key = tavily_api_key or os.getenv("TAVILY_API_KEY")
        if not api_key:
            logger.error("🚨 [치명적 오류] TAVILY_API_KEY가 없습니다! 검색이 불가능하여 링크가 생성되지 않습니다.")
            self.tavily = None
        else:
            self.tavily = TavilyClient(api_key=api_key)
            logger.info(f"✅ Tavily 클라이언트 로드 완료 (Key: {api_key[:4]}***)")
    
    def _search_tavily(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """Tavily API로 검색 수행"""
        if not self.tavily:
            logger.warning("⚠️ Tavily 객체가 없어 검색을 스킵합니다.")
            return []
        
        try:
            logger.info(f"🔍 검색 수행 중... 검색어: [{query}]")
            response = self.tavily.search(
                query=query,
                search_depth="advanced", # 깊은 검색
                max_results=max_results,
                include_answer=False,
                include_raw_content=True,  # raw_content 포함하여 더 많은 정보 확보
                include_images=False,
            )
            
            results = []
            for item in response.get("results", []):
                # content와 raw_content 중 더 긴 것을 사용
                content = item.get("content", "")
                raw_content = item.get("raw_content", "")
                
                # raw_content가 있으면 우선 사용 (더 상세한 정보)
                if raw_content and len(raw_content) > len(content):
                    snippet = raw_content[:500]  # 금융 정보는 더 긴 snippet 필요
                else:
                    snippet = content[:500]  # 200자에서 500자로 증가
                
                results.append({
                    "title": item.get("title", "제목 없음"),
                    "url": item.get("url", ""),
                    "snippet": snippet,
                    "score": item.get("score", 0)
                })
                
                # 디버깅: 검색 결과 로깅
                logger.debug(f"검색 결과 [{item.get('title', '')}]: {snippet[:100]}...")
            
            logger.info(f"✅ 검색 완료: {len(results)}개의 결과를 찾았습니다.")
            return results
            
        except Exception as e:
            logger.error(f"❌ Tavily 검색 API 호출 중 에러 발생: {e}")
            return []
    
    def _normalize_relative_dates(self, message: str) -> str:
        """상대적 날짜 키워드를 현재 날짜 기준으로 변환"""
        now = datetime.now()
        current_year = now.year
        current_month = now.month
        current_day = now.day
        
        # 상대적 날짜 키워드 매핑
        date_replacements = {
            # 연도 관련
            r'작년': f'{current_year - 1}년',
            r'작작년': f'{current_year - 2}년',
            r'내년': f'{current_year + 1}년',
            r'내후년': f'{current_year + 2}년',
            r'올해': f'{current_year}년',
            r'금년': f'{current_year}년',
            
            # 월 관련
            r'지난달': f'{(current_month - 1) if current_month > 1 else 12}월',
            r'다음달': f'{(current_month + 1) if current_month < 12 else 1}월',
            r'이번달': f'{current_month}월',
            r'이달': f'{current_month}월',
            
            # 주 관련
            r'지난주': (now - timedelta(weeks=1)).strftime('%Y년 %m월 %d일'),
            r'다음주': (now + timedelta(weeks=1)).strftime('%Y년 %m월 %d일'),
            r'이번주': now.strftime('%Y년 %m월 %d일'),
            r'금주': now.strftime('%Y년 %m월 %d일'),
            
            # 일 관련
            r'어제': (now - timedelta(days=1)).strftime('%Y년 %m월 %d일'),
            r'내일': (now + timedelta(days=1)).strftime('%Y년 %m월 %d일'),
            r'오늘': now.strftime('%Y년 %m월 %d일'),
            r'모레': (now + timedelta(days=2)).strftime('%Y년 %m월 %d일'),
            r'그저께': (now - timedelta(days=2)).strftime('%Y년 %m월 %d일'),
        }
        
        normalized_message = message
        for pattern, replacement in date_replacements.items():
            # 단어 경계를 고려한 정규식 (한글 특성상 공백이나 문장 부호로 구분)
            normalized_message = re.sub(
                pattern, 
                replacement, 
                normalized_message,
                flags=re.IGNORECASE
            )
        
        # 추가: "N일 전", "N일 후", "N주 전", "N주 후" 같은 패턴 처리
        def replace_relative_days(match):
            num = int(match.group(1))
            unit = match.group(2)
            direction = match.group(3)
            
            if '일' in unit or 'day' in unit.lower():
                if '전' in direction or 'ago' in direction.lower():
                    target_date = now - timedelta(days=num)
                else:
                    target_date = now + timedelta(days=num)
                return target_date.strftime('%Y년 %m월 %d일')
            elif '주' in unit or 'week' in unit.lower():
                if '전' in direction or 'ago' in direction.lower():
                    target_date = now - timedelta(weeks=num)
                else:
                    target_date = now + timedelta(weeks=num)
                return target_date.strftime('%Y년 %m월 %d일')
            return match.group(0)
        
        # "N일 전/후", "N주 전/후" 패턴 처리
        normalized_message = re.sub(
            r'(\d+)\s*(일|주|day|week)\s*(전|후|ago|later)',
            replace_relative_days,
            normalized_message,
            flags=re.IGNORECASE
        )
        
        return normalized_message
    
    def _summarize_with_sources(self, original_question: str, search_results: List[Dict[str, str]]) -> str:
        """검색 결과를 바탕으로 답변 생성"""
        if not search_results:
            return None
        
        # 현재 시간 정보 가져오기
        current_time = datetime.now().strftime("%Y년 %m월 %d일 %H:%M:%S")
        current_date = datetime.now().strftime("%Y년 %m월 %d일")
        
        # 문맥 생성 (더 상세하게)
        context_parts = []
        for i, result in enumerate(search_results, 1):
            # 검색 결과를 더 명확하게 구조화
            snippet = result.get('snippet', '').strip()
            context_parts.append(f"""
[검색 결과 {i}]
제목: {result.get('title', '제목 없음')}
URL: {result.get('url', '')}
내용: {snippet}
""")
        context = "\n".join(context_parts)
        
        # 금융 관련 키워드 확인
        financial_keywords = ['가격', '시세', '시장가', '현재가', '비트코인', 'BTC', '이더리움', 'ETH', 
                             '주식', '코인', '암호화폐', '가상화폐', '환율', '금리', '시가총액', '거래량',
                             '삼성전자', 'SK하이닉스', 'LG', '현대차', '기아', '네이버', '카카오']
        is_financial_query = any(keyword in original_question for keyword in financial_keywords)
        
        # 금융 정보에 대한 추가 경고
        financial_warning = ""
        if is_financial_query:
            financial_warning = f"""
**⚠️ 금융 정보 특별 주의사항 (반드시 준수):**
- 현재 날짜는 {current_date}입니다. 반드시 이 날짜 기준의 최신 정보만 사용하세요.
- 주가, 시세, 가격 정보는 반드시 검색 결과에서 명확하게 확인된 값만 사용하세요.
- 여러 검색 결과의 가격이 다르면, 가장 최신 날짜({current_date})의 정보를 우선 사용하세요.
- 검색 결과에 명확한 가격이 없거나 오래된 날짜의 정보면 "정확한 최신 정보를 찾을 수 없습니다"라고 답변하세요.
- 비현실적인 수치(예: 주가가 10만원 이상, 시가총액이 1000조 이상)는 절대 사용하지 마세요.
- 훈련 데이터의 정보는 절대 사용하지 마세요. 오직 검색 결과만 사용하세요.
"""
        
        # 검색 결과에서 숫자(가격) 정보 추출 강조
        number_extraction_instruction = ""
        if is_financial_query:
            number_extraction_instruction = """
**💰 숫자 추출 방법:**
- 검색 결과에서 가격, 시세, 주가 등의 숫자를 정확히 찾으세요.
- 예: "113,159,643.5" 또는 "$86,892.97" 같은 형식의 숫자를 찾으세요.
- 여러 검색 결과에 다른 숫자가 있으면, 가장 최신 정보(날짜가 명시된 것)를 우선 사용하세요.
- 숫자 뒤에 단위(원, 달러, % 등)가 있으면 반드시 포함하세요.
"""
        
        summarize_prompt = f"""
**현재 시각: {current_time}**
**오늘 날짜: {current_date}**

⚠️ **절대 규칙: 모든 정보는 {current_date} 기준으로만 답변하세요.**

다음은 웹 검색 결과입니다. 이를 바탕으로 사용자 질문에 답변하세요.

사용자 질문: "{original_question}"

검색 결과:
{context}

{number_extraction_instruction}

{financial_warning}

**🔴 필수 작성 규칙 (반드시 준수):**
1. **절대 규칙**: 반드시 **검색 결과에 포함된 내용만**을 기반으로 답변하세요. 훈련 데이터는 절대 사용하지 마세요.
2. **숫자 추출**: 검색 결과에서 가격, 시세, 주가 등의 숫자를 정확히 추출하세요. 
   - 여러 검색 결과에 다른 숫자가 있으면 모두 나열하고, 가장 최신 정보를 우선 사용하세요.
   - 예: "검색 결과에 따르면 비트코인 가격은 113,159,643.5원(Investing.com 기준) 또는 108,775,537원(다른 소스 기준)으로 확인됩니다."
3. **날짜 확인**: 검색 결과에 날짜가 있으면 반드시 확인하고, {current_date} 기준의 최신 정보만 사용하세요.
4. **금융 정보**: 금융 정보(주식, 암호화폐, 환율 등)는 반드시 검색 결과에서만 제공하세요. 훈련 데이터는 절대 사용 금지.
5. **날짜 명시**: 답변 시작 시 반드시 "{current_date} 기준"이라고 명시하세요.
6. **최신 정보 우선**: 검색 결과에 여러 날짜의 정보가 있으면, 가장 최신 날짜의 정보를 사용하세요.
7. **정보 부족 시**: 검색 결과에 {current_date} 기준의 명확한 정보가 없으면 "최신 정보를 찾을 수 없습니다"라고 명시하세요.
8. **답변 길이**: 답변 길이는 3~5문장으로 요약하세요.
9. **링크 언급 금지**: 링크는 UI에서 별도로 표시하므로, 답변 본문에 "링크를 참조하세요"라고 적지 마세요.
10. **검색 결과 활용**: 검색 결과의 모든 숫자와 정보를 꼼꼼히 확인하고, 가장 신뢰할 수 있는 소스(높은 score)의 정보를 우선 사용하세요.
11. **정확성**: 검색 결과에 명확한 숫자가 있으면 그대로 사용하세요. 추측하거나 근사치를 사용하지 마세요.

**📝 마크다운 형식 규칙 (가독성을 위해 반드시 지켜주세요):**

1. **굵은 글씨(Bold)**: 중요한 키워드, 인물명, 기관명, 수치는 반드시 **굵게** 표시하세요.
   - 예: **대구시교육청**, **2026년**, **113,159,643원**

2. **섹션 구분**: 정보가 길거나 여러 주제가 있을 때는 ### 헤딩을 사용하세요.
   - 예: ### 주요 내용, ### 결론

3. **번호 리스트**: 여러 항목을 나열할 때 번호 리스트(1. 2. 3.)를 사용하세요.
   - 예: 1. 첫 번째 내용 2. 두 번째 내용

4. **인용문**: 중요한 발언이나 핵심 메시지는 인용문(>)으로 강조하세요.
   - 예: > "핵심 메시지나 중요 결론"

5. **문단 분리**: 내용이 길 때 적절히 문단을 나누어 가독성을 높이세요.

**예시 답변:**
**2026년 02월 04일** 기준, **김선호** 배우가 세금 회피 의혹에 휘말렸습니다.

### 주요 내용
그는 가족 법인을 운영하며 **탈세를 목적**으로 설립했다는 보도가 있었으나, 소속사 **판타지오**는 이를 부인하며 해당 법인은 **연극 활동**을 위한 것이라고 밝혔습니다.

> "현재 김선호는 법인 폐업 절차를 밟고 있다고 전했습니다."

### 결론
김선호 측은 절세나 탈세를 목적으로 한 것이 **아니라**고 강조했습니다.
"""
        try:
            # 금융 정보는 더 낮은 temperature로 정확성 향상
            temperature = 0.3 if is_financial_query else 0.5
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": summarize_prompt}],
                max_tokens=600,
                temperature=temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"요약 생성 에러: {e}")
            return None

    def _should_skip_search(self, message: str) -> bool:
        """검색이 필요 없는 질문인지 판단"""
        message_lower = message.lower().strip()
        
        # 인사말 패턴
        greetings = [
            '안녕', '안녕하세요', '안녕하셔', '하이', '헬로', '헬로우', 'hi', 'hello',
            '반가워', '반갑다', '반갑습니다', '반가와', '반가워요',
            '고마워', '고마워요', '고맙다', '고맙습니다', '감사', 'thank', 'thanks',
            '미안', '미안해', '미안합니다', '죄송', 'sorry',
            '잘가', '잘가요', '안녕히가', '안녕히가세요', 'bye', 'goodbye',
            'ㅎㅇ', 'ㅎㅎ', 'ㅋㅋ', 'ㅇㅇ', 'ㄴㄴ'
        ]
        
        # 자기소개/기능 질문 패턴
        self_intro_patterns = [
            '넌 누구', '너는 누구', '너 누구', '너는 뭐', '너 뭐', '너는 누구야', '너는 뭐야',
            '넌 뭐', '넌 누구야', '넌 뭐야', '너는 누구니', '너는 뭐니', '넌 누구니', '넌 뭐니',
            '너는 누구', '너는 뭐', '너는 누구', '너는 뭐',
            '무슨 일', '뭘 할 수', '무엇을 할 수', '할 수 있는', '할 수 있어',
            '뭘 할 수 있어', '무엇을 할 수 있어', '뭘 할 수 있니', '무엇을 할 수 있니',
            '너는 뭘', '넌 뭘', '너는 무엇', '넌 무엇',
            '너는 누구', '넌 누구', '너는 뭐', '넌 뭐',
            'who are you', 'what are you', 'what can you', 'what do you'
        ]
        
        # 간단한 대화 패턴
        simple_chat_patterns = [
            '좋아', '좋아요', '좋다', '좋습니다', 'good', 'nice', 'great',
            '싫어', '싫어요', '싫다', '싫습니다', 'hate', 'dislike',
            '맞아', '맞아요', '맞다', '맞습니다', 'right', 'correct',
            '틀려', '틀렸어', '틀렸어요', 'wrong', 'incorrect',
            '알겠어', '알겠어요', '알겠습니다', '알았어', '알았어요', 'ok', 'okay',
            '괜찮아', '괜찮아요', '괜찮습니다', 'fine', 'alright'
        ]
        
        # 개념 질문 패턴 (뭐야, 무엇이야, 뭐니, 무엇이니 등)
        # 단, 금융 시세나 최신 정보가 필요한 경우는 제외
        concept_question_patterns = [
            '뭐야', '뭐야?', '뭐야.', '뭐야!',
            '뭐니', '뭐니?', '뭐니.', '뭐니!',
            '무엇이야', '무엇이야?', '무엇이니', '무엇이니?',
            '뭔데', '뭔데?', '뭔가', '뭔가?',
            '무엇인가', '무엇인가?', '무엇인지', '무엇인지?',
            '뭐지', '뭐지?', '뭔지', '뭔지?',
            'what is', 'what are', 'what does', 'what do'
        ]
        
        # 최신 정보가 필요한 키워드 (이런 키워드가 있으면 검색 필요)
        needs_latest_info = [
            '현재', '지금', '오늘', '최근', '최신', '실시간', '현재가', '시세', '가격',
            '주가', '환율', '금리', '거래량', '시가총액', 'current', 'now', 'today', 'latest', 'realtime'
        ]
        
        # 메시지가 인사말인지 확인
        if any(greeting in message_lower for greeting in greetings):
            logger.info(f"인사말로 판단되어 검색을 스킵합니다: {message}")
            return True
        
        # 메시지가 자기소개/기능 질문인지 확인
        if any(pattern in message_lower for pattern in self_intro_patterns):
            logger.info(f"자기소개/기능 질문으로 판단되어 검색을 스킵합니다: {message}")
            return True
        
        # 메시지가 간단한 대화인지 확인
        if any(pattern in message_lower for pattern in simple_chat_patterns) and len(message) < 20:
            logger.info(f"간단한 대화로 판단되어 검색을 스킵합니다: {message}")
            return True
        
        # 개념 질문인지 확인 (최신 정보가 필요하지 않은 경우만)
        if any(pattern in message_lower for pattern in concept_question_patterns):
            # "현재", "지금", "오늘", "최근", "최신", "실시간", "현재가", "시세", "가격" 같은 명시적인 최신 정보 요청 키워드만 확인
            # "금리", "주가", "환율" 같은 단어 자체는 개념 질문일 수 있으므로 제외
            explicit_latest_keywords = [
                '현재', '지금', '오늘', '최근', '최신', '실시간', '현재가', '시세', '가격',
                'current', 'now', 'today', 'latest', 'realtime', 'price', 'rate now'
            ]
            if not any(keyword in message_lower for keyword in explicit_latest_keywords):
                logger.info(f"개념 질문으로 판단되어 검색을 스킵합니다: {message}")
                return True
        
        # 매우 짧은 메시지 (3자 이하)는 검색 스킵
        if len(message.strip()) <= 3:
            logger.info(f"메시지가 너무 짧아 검색을 스킵합니다: {message}")
            return True
        
        return False
    
    def process_message(self, message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """메시지 처리 메인 함수"""
        
        # 1. 검색이 필요 없는 질문인지 확인
        if self._should_skip_search(message):
            return {"reply": None, "searched": False}

        # 2. 상대적 날짜 키워드를 실제 날짜로 변환
        normalized_message = self._normalize_relative_dates(message)
        if normalized_message != message:
            logger.info(f"📅 날짜 변환: '{message}' → '{normalized_message}'")

        # 현재 날짜를 검색 쿼리에 자동 추가 (최신 정보 검색 보장)
        current_date = datetime.now().strftime("%Y년 %m월 %d일")
        current_year = datetime.now().strftime("%Y년")
        
        # 검색 쿼리에 날짜 정보 추가
        # 금융/시세 관련 키워드가 있으면 더 강력하게 날짜 추가
        financial_keywords = ['가격', '시세', '시장가', '현재가', '비트코인', 'BTC', '이더리움', 'ETH', 
                             '주식', '코인', '암호화폐', '가상화폐', '환율', '금리', '시가총액', '거래량',
                             '삼성전자', 'SK하이닉스', 'LG', '현대차', '기아', '네이버', '카카오']
        is_financial = any(keyword in normalized_message for keyword in financial_keywords)
        
        # 변환된 메시지에 이미 날짜가 포함되어 있는지 확인
        has_date_in_message = any(keyword in normalized_message for keyword in ['년', '월', '일'])
        
        if is_financial:
            # 금융 정보는 반드시 현재 날짜 포함 (이미 날짜가 있으면 중복 방지)
            if has_date_in_message:
                search_query = normalized_message
            else:
                search_query = f"{normalized_message} {current_date} 현재 최신"
        else:
            # 일반 정보도 현재 연도 포함 (이미 날짜가 있으면 중복 방지)
            if has_date_in_message:
                search_query = normalized_message
            else:
                search_query = f"{normalized_message} {current_year}"

        # 2. 검색 수행
        logger.info(f"🚀 검색 프로세스 시작: {search_query}")
        
        if not self.tavily:
            # 키가 없어서 실패한 경우, UI에 에러를 띄우기 위해 특별한 메시지 리턴
            return {
                "reply": "죄송합니다. 서버에 Tavily 검색 API 키가 설정되지 않아 최신 정보를 가져올 수 없습니다. (.env 파일을 확인해주세요)",
                "searched": False,
                "sources": []
            }

        search_results = self._search_tavily(search_query)
        
        if not search_results:
            logger.warning("검색 결과가 0건입니다. 일반 답변으로 전환합니다.")
            return {"reply": None, "searched": False}
        
        # 3. 답변 생성
        summary = self._summarize_with_sources(message, search_results)
        
        if not summary:
            return {"reply": None, "searched": False}
        
        # 4. 결과 반환 (여기에 sources가 있어야 UI에 뜸)
        return {
            "reply": summary,
            "searched": True,
            "search_query": search_query,
            "sources": search_results # 원본 검색 결과 전체 전달
        }