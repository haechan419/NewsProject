# trending_service.py - 실시간 검색어 서비스 (Signal.bz API)
import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx

# 로거 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TrendingService:
    """실시간 검색어 서비스 클래스 (Signal.bz API 사용)"""
    
    # Signal.bz 실시간 검색어 API URL
    API_URL = "https://api.signal.bz/news/realtime/"
    
    # 실시간 검색어 관련 트리거 키워드
    TRENDING_TRIGGER_KEYWORDS = [
        # 직접적 표현
        "실시간 검색어", "실검", "인기 검색어", "급상승 검색어",
        "트렌딩", "trending", "핫토픽", "hot topic", "핫 토픽",
        
        # 질문형 - "뭐가 핫해", "뭐가 뜨고 있어" 등
        "지금 뭐가 핫", "요즘 뭐가 핫", "지금 뭐가 뜨", "요즘 뭐가 뜨",
        "지금 인기있는", "요즘 인기있는", "지금 제일 핫", "요즘 제일 핫",
        "지금 뜨는", "요즘 뜨는", "핫한 게 뭐", "뜨는 게 뭐",
        "사람들이 뭘 검색", "뭐가 화제", "뭐가 이슈", "뭐가 트렌드",
        "지금 이슈", "요즘 이슈", "화제인 거", "관심사가 뭐",
        "뭐가 유행", "지금 유행", "요즘 유행",
        
        # 추가 패턴
        "핫한거", "핫한 거", "핫한게", "핫한 게",
        "뜨는거", "뜨는 거", "뜨는게", "뜨는 게",
        "인기있는거", "인기있는 거", "인기있는게", "인기있는 게",
        "많이 검색", "많이 찾는", "인기 키워드", "인기키워드",
        
        # 영어
        "what's hot", "what's trending", "what's popular",
        "trending now", "popular now", "whats hot", "whats trending"
    ]
    
    def __init__(self, update_interval: int = 300):
        """
        TrendingService 초기화
        
        Args:
            update_interval: 캐시 갱신 주기 (초), 기본값 300초(5분)
        """
        self.update_interval = update_interval
        self._cache: Dict[str, Any] = {
            "keywords": [],
            "updated_at": None,
            "source": "signal.bz",
            "error": None
        }
        self._is_running = False
        logger.info(f"✅ TrendingService 초기화 완료 (갱신 주기: {update_interval}초)")
    
    async def fetch_trending_keywords(self) -> List[Dict[str, Any]]:
        """
        Signal.bz API에서 실시간 검색어 가져오기
        
        Returns:
            실시간 검색어 목록 (10개)
            [{"rank": 1, "keyword": "검색어", "state": "n"}, ...]
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.API_URL)
                response.raise_for_status()
                
                data = response.json()
                top10 = data.get("top10", [])
                
                # 상위 10개만 추출
                keywords = []
                for item in top10[:10]:
                    keywords.append({
                        "rank": item.get("rank"),
                        "keyword": item.get("keyword"),
                        "state": item.get("state", "")  # s=유지, n=신규, +=상승
                    })
                
                logger.info(f"✅ 실시간 검색어 {len(keywords)}개 가져옴: {[k['keyword'] for k in keywords[:3]]}...")
                return keywords
                
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Signal.bz API HTTP 에러: {e.response.status_code}")
            raise
        except httpx.RequestError as e:
            logger.error(f"❌ Signal.bz API 요청 에러: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"❌ 실시간 검색어 가져오기 실패: {str(e)}")
            raise
    
    async def update_cache(self) -> bool:
        """
        캐시 업데이트
        
        Returns:
            성공 여부
        """
        try:
            keywords = await self.fetch_trending_keywords()
            self._cache = {
                "keywords": keywords,
                "updated_at": datetime.now().isoformat(),
                "source": "signal.bz",
                "error": None
            }
            logger.info(f"✅ 캐시 업데이트 완료: {self._cache['updated_at']}")
            return True
            
        except Exception as e:
            error_msg = f"캐시 업데이트 실패: {str(e)}"
            logger.error(f"❌ {error_msg}")
            # 에러 발생 시에도 기존 캐시 유지, 에러 메시지만 추가
            self._cache["error"] = error_msg
            return False
    
    async def start_background_update(self):
        """백그라운드에서 주기적으로 캐시 갱신"""
        if self._is_running:
            logger.warning("⚠️ 백그라운드 업데이트가 이미 실행 중입니다")
            return
        
        self._is_running = True
        logger.info(f"🚀 백그라운드 캐시 갱신 시작 (주기: {self.update_interval}초)")
        
        # 최초 1회 즉시 실행
        await self.update_cache()
        
        while self._is_running:
            try:
                await asyncio.sleep(self.update_interval)
                await self.update_cache()
            except asyncio.CancelledError:
                logger.info("🛑 백그라운드 업데이트 중지됨")
                break
            except Exception as e:
                logger.error(f"❌ 백그라운드 업데이트 에러: {str(e)}")
                # 에러 발생해도 계속 시도
                await asyncio.sleep(60)  # 1분 후 재시도
    
    def stop_background_update(self):
        """백그라운드 업데이트 중지"""
        self._is_running = False
        logger.info("🛑 백그라운드 업데이트 중지 요청됨")
    
    def get_cached_keywords(self) -> Dict[str, Any]:
        """
        캐시된 실시간 검색어 반환
        
        Returns:
            {
                "keywords": [...],
                "updated_at": "2025-02-03T14:30:00",
                "source": "signal.bz",
                "error": None or "에러 메시지"
            }
        """
        return self._cache.copy()
    
    def is_trending_question(self, message: str) -> bool:
        """
        실시간 검색어 관련 질문인지 판단
        
        Args:
            message: 사용자 메시지
            
        Returns:
            실시간 검색어 관련 질문이면 True
        """
        message_lower = message.lower().strip()
        
        for keyword in self.TRENDING_TRIGGER_KEYWORDS:
            if keyword.lower() in message_lower:
                logger.info(f"🎯 실시간 검색어 질문 감지: '{message}' (매칭: '{keyword}')")
                return True
        
        return False
    
    def format_trending_response(self) -> Dict[str, Any]:
        """
        AI 응답용 실시간 검색어 포맷팅
        
        Returns:
            {
                "reply": "포맷된 응답 텍스트",
                "is_trending": True,
                "trending_data": {...} or None,
                "error": None or "에러 메시지"
            }
        """
        cache = self.get_cached_keywords()
        
        # 캐시가 비어있거나 에러가 있는 경우
        if not cache["keywords"]:
            return {
                "reply": "죄송합니다. 현재 인기 검색어를 조회할 수 없습니다. 잠시 후 다시 시도해주세요.",
                "is_trending": True,
                "trending_data": None,
                "error": cache.get("error", "데이터 없음")
            }
        
        # 시간 포맷팅
        updated_at = cache.get("updated_at", "")
        if updated_at:
            try:
                dt = datetime.fromisoformat(updated_at)
                time_str = dt.strftime("%H:%M")
            except:
                time_str = "방금"
        else:
            time_str = "방금"
        
        # 응답 텍스트 생성
        keywords = cache["keywords"]
        keyword_lines = []
        for item in keywords:
            rank = item["rank"]
            keyword = item["keyword"]
            state = item.get("state", "")
            
            # 상태 이모지
            if state == "n":
                state_emoji = "🆕"  # 신규
            elif state == "+":
                state_emoji = "🔺"  # 상승
            else:
                state_emoji = ""  # 유지
            
            keyword_lines.append(f"{rank}. {keyword} {state_emoji}".strip())
        
        keywords_text = "\n".join(keyword_lines)
        
        reply = f"""🔥 **실시간 인기 검색어** ({time_str} 기준)

{keywords_text}

💡 궁금한 키워드가 있으시면 클릭하거나 말씀해주세요! 자세한 정보를 검색해드릴게요."""
        
        return {
            "reply": reply,
            "is_trending": True,
            "trending_data": {
                "keywords": keywords,
                "updated_at": updated_at,
                "source": cache["source"]
            },
            "error": None
        }
    
    def get_keyword_list(self) -> List[str]:
        """
        검색어 문자열 목록만 반환 (컨텍스트 제공용)
        
        Returns:
            ["검색어1", "검색어2", ...]
        """
        cache = self.get_cached_keywords()
        return [item["keyword"] for item in cache.get("keywords", [])]


# 싱글톤 인스턴스 (전역에서 공유)
trending_service = TrendingService(update_interval=300)  # 5분
