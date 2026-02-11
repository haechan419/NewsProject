"""
환율 크롤링 모듈 (API 한도 초과 시 사용)
네이버, 하나은행, 한국수출입은행 웹사이트에서 환율 정보 크롤링
"""
import requests
from bs4 import BeautifulSoup
from typing import List, Optional, Dict
from datetime import datetime
import logging
import re
from decimal import Decimal

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
TIMEOUT = 10


class ExchangeRateCrawler:
    """환율 크롤링 클래스"""
    
    def __init__(self, timeout: int = TIMEOUT):
        """
        초기화
        
        Args:
            timeout: 요청 타임아웃 (초)
        """
        self.timeout = timeout
    
    def crawl_exchange_rates(self, search_date: Optional[str] = None) -> List[Dict]:
        """
        환율 데이터 크롤링
        
        Args:
            search_date: 조회 날짜 (yyyyMMdd 형식, None이면 당일)
        
        Returns:
            환율 데이터 리스트 (KoreaEximApiResponseDTO 형식)
        """
        if search_date is None:
            search_date = datetime.now().strftime("%Y%m%d")
        
        # logger.info(f"[크롤링] 환율 데이터 수집 시작 - 날짜: {search_date}")
        
        # 네이버 → 하나은행 → 한국수출입은행 순서로 시도
        rates = []
        
        # 1. 네이버 환율 크롤링 시도
        # logger.info("[크롤링] 네이버 환율 정보 크롤링 시도")
        rates = self._crawl_naver_exchange_rates(search_date)
        
        # 2. 하나은행 환율 크롤링 시도
        if not rates:
            # logger.info("[크롤링] 하나은행 환율 정보 크롤링 시도")
            rates = self._crawl_hana_bank_exchange_rates(search_date)
        
        # 3. 한국수출입은행 웹사이트 크롤링 시도
        if not rates:
            # logger.info("[크롤링] 한국수출입은행 웹사이트 크롤링 시도")
            rates = self._crawl_korea_exim_website(search_date)
        
        if not rates:
            # logger.warn(f"[크롤링] 환율 데이터를 찾을 수 없습니다. 날짜: {search_date}")
            return []
        
        # logger.info(f"[크롤링] 환율 데이터 수집 완료 - 날짜: {search_date}, 개수: {len(rates)}")
        return rates
    
    def _crawl_naver_exchange_rates(self, search_date: str) -> List[Dict]:
        """네이버 환율 정보 크롤링"""
        rates = []
        
        try:
            url = "https://finance.naver.com/marketindex/exchangeList.naver"
            logger.info(f"[크롤링] 네이버 환율 페이지 접속 시도: {url}")
            
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            logger.debug("[크롤링] 네이버 페이지 로드 완료")
            
            # 여러 선택자 패턴 시도
            selectors = [
                "table.tbl_exchange tbody tr",
                "table.tbl_exchange tr",
                "table#_exchangeList tbody tr",
                "table#_exchangeList tr",
                ".tbl_exchange tbody tr",
                ".tbl_exchange tr",
                "table tbody tr",
                "div.exchange_info table tbody tr",
                "div.exchange_info table tr"
            ]
            
            rows = None
            for selector in selectors:
                rows = soup.select(selector)
                if rows:
                    # logger.info(f"[크롤링] 선택자 성공: {selector} (행 개수: {len(rows)})")
                    break
            
            if not rows:
                # logger.warn("[크롤링] 모든 선택자 실패. 페이지 구조 확인 필요.")
                return rates
            
            # logger.info(f"[크롤링] 네이버 환율 테이블 행 개수: {len(rows)}")
            
            for row in rows:
                try:
                    cells = row.select("td")
                    
                    # 헤더 행 스킵
                    if row.select("th") and not cells:
                        continue
                    
                    if len(cells) < 2:
                        continue
                    
                    # 네이버 환율 테이블 구조: [0]통화명, [1]매매기준율, [2]TTS, [3]TTB
                    currency_info = cells[0].get_text(strip=True) if cells[0] else ""
                    deal_bas_r = self._clean_number(cells[1].get_text(strip=True)) if len(cells) > 1 else None
                    ttb = self._clean_number(cells[3].get_text(strip=True)) if len(cells) > 3 else None
                    tts = self._clean_number(cells[2].get_text(strip=True)) if len(cells) > 2 else None
                    
                    if not currency_info:
                        continue
                    
                    # 통화 코드 추출
                    cur_unit = self._extract_currency_code(currency_info)
                    if not cur_unit:
                        # logger.debug(f"[크롤링] 통화 코드 추출 실패: {currency_info}")
                        continue
                    
                    # 통화명 정리 (괄호 제거)
                    cur_nm = currency_info
                    if "(" in cur_nm:
                        cur_nm = cur_nm[:cur_nm.index("(")].strip()
                    
                    rate_data = {
                        "curUnit": cur_unit,
                        "curNm": cur_nm,
                        "dealBasR": deal_bas_r,
                        "ttb": ttb,
                        "tts": tts,
                        "result": 1
                    }
                    rates.append(rate_data)
                    # logger.debug(f"[크롤링] 네이버 환율 데이터 파싱 성공: {cur_unit} - {deal_bas_r}")
                    
                except Exception as e:
                    # logger.debug(f"[크롤링] 네이버 환율 행 파싱 실패: {e}")
                    continue
            
            # logger.info(f"[크롤링] 네이버 환율 크롤링 완료 - 수집된 데이터: {len(rates)}개")
            
        except Exception as e:
            logger.error(f"[크롤링] 네이버 환율 크롤링 실패: {e}", exc_info=True)
        
        return rates
    
    def _crawl_hana_bank_exchange_rates(self, search_date: str) -> List[Dict]:
        """하나은행 환율 정보 크롤링"""
        rates = []
        
        try:
            url = "https://www.kebhana.com/cont/mall/mall15/mall1501/index.jsp"
            logger.info(f"[크롤링] 하나은행 환율 페이지 접속 시도: {url}")
            
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            logger.debug("[크롤링] 하나은행 페이지 로드 완료")
            
            # 하나은행 환율 테이블 찾기
            rows = soup.select("table.tblType tbody tr")
            if not rows:
                rows = soup.select("table tbody tr")
            if not rows:
                rows = soup.select("table tr")
            
            # logger.info(f"[크롤링] 하나은행 환율 테이블 행 개수: {len(rows)}")
            
            for row in rows:
                try:
                    cells = row.select("td")
                    if len(cells) < 3:
                        continue
                    
                    currency = cells[0].get_text(strip=True) if cells[0] else ""
                    deal_bas_r = None
                    ttb = None
                    tts = None
                    
                    # 매매기준율, TTB, TTS 찾기
                    for i in range(1, len(cells)):
                        cell_text = self._clean_number(cells[i].get_text(strip=True))
                        if cell_text and re.match(r"^\d+\.?\d*$", cell_text):
                            if deal_bas_r is None:
                                deal_bas_r = cell_text
                            elif ttb is None:
                                ttb = cell_text
                            elif tts is None:
                                tts = cell_text
                    
                    if not currency:
                        continue
                    
                    # 통화 코드 추출
                    cur_unit = self._extract_currency_code(currency)
                    if not cur_unit:
                        continue
                    
                    rate_data = {
                        "curUnit": cur_unit,
                        "curNm": currency,
                        "dealBasR": deal_bas_r,
                        "ttb": ttb,
                        "tts": tts,
                        "result": 1
                    }
                    rates.append(rate_data)
                    
                except Exception as e:
                    # logger.debug(f"[크롤링] 하나은행 환율 행 파싱 실패: {e}")
                    continue
            
            # logger.info(f"[크롤링] 하나은행 환율 크롤링 완료 - 수집된 데이터: {len(rates)}개")
            
        except Exception as e:
            logger.error(f"[크롤링] 하나은행 환율 크롤링 실패: {e}", exc_info=True)
        
        return rates
    
    def _crawl_korea_exim_website(self, search_date: str) -> List[Dict]:
        """한국수출입은행 공식 웹사이트 환율 정보 크롤링"""
        rates = []
        
        try:
            url = "https://www.koreaexim.go.kr/site/program/financial/exchange"
            logger.info(f"[크롤링] 한국수출입은행 환율 페이지 접속 시도: {url}")
            
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 환율 테이블 찾기
            rows = soup.select("table.exchange-rate-table tbody tr")
            
            for row in rows:
                try:
                    cells = row.select("td")
                    if len(cells) < 5:
                        continue
                    
                    cur_unit = cells[0].get_text(strip=True) if cells[0] else ""
                    cur_nm = cells[1].get_text(strip=True) if cells[1] else ""
                    deal_bas_r = self._clean_number(cells[2].get_text(strip=True)) if len(cells) > 2 else None
                    ttb = self._clean_number(cells[3].get_text(strip=True)) if len(cells) > 3 else None
                    tts = self._clean_number(cells[4].get_text(strip=True)) if len(cells) > 4 else None
                    
                    if not cur_unit:
                        continue
                    
                    rate_data = {
                        "curUnit": cur_unit,
                        "curNm": cur_nm,
                        "dealBasR": deal_bas_r,
                        "ttb": ttb,
                        "tts": tts,
                        "result": 1
                    }
                    rates.append(rate_data)
                    
                except Exception as e:
                    # logger.debug(f"[크롤링] 한국수출입은행 환율 행 파싱 실패: {e}")
                    continue
            
            # logger.info(f"[크롤링] 한국수출입은행 환율 크롤링 완료 - 수집된 데이터: {len(rates)}개")
            
        except Exception as e:
            logger.error(f"[크롤링] 한국수출입은행 환율 크롤링 실패: {e}", exc_info=True)
        
        return rates
    
    def _clean_number(self, value: Optional[str]) -> Optional[str]:
        """숫자 문자열 정리 (쉼표, 공백 제거)"""
        if not value:
            return None
        return value.replace(",", "").replace(" ", "").strip()
    
    def _extract_currency_code(self, text: str) -> Optional[str]:
        """통화 코드 추출"""
        if not text:
            return None
        
        # 대문자 3자리 통화 코드 패턴 찾기
        pattern = re.compile(r"([A-Z]{3})")
        match = pattern.search(text.upper())
        if match:
            return match.group(1)
        
        # 통화명 매핑
        upper_text = text.upper()
        currency_mappings = {
            "USD": ["달러", "DOLLAR"],
            "JPY": ["엔", "YEN"],
            "EUR": ["유로", "EURO"],
            "CNY": ["위안", "YUAN"],
            "GBP": ["파운드", "POUND"],
            "HKD": ["홍콩"],
            "SGD": ["싱가포르"],
            "THB": ["태국"],
            "AUD": ["호주"],
            "CAD": ["캐나다"],
            "CHF": ["스위스"],
            "SEK": ["스웨덴"],
            "NOK": ["노르웨이"],
            "NZD": ["뉴질랜드"]
        }
        
        for code, keywords in currency_mappings.items():
            if any(keyword in upper_text for keyword in keywords) or code in upper_text:
                return code
        
        return None


if __name__ == "__main__":
    # 테스트 코드
    logging.basicConfig(level=logging.INFO)
    
    crawler = ExchangeRateCrawler()
    rates = crawler.crawl_exchange_rates()
    
    print(f"\n크롤링 결과: {len(rates)}개")
    for rate in rates[:5]:
        print(f"  {rate['curUnit']}: {rate['curNm']} - {rate['dealBasR']}")
