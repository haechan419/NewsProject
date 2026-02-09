"""
주가지수 크롤링 모듈 (API 한도 초과 시 사용)
네이버 금융에서 KOSPI, KOSDAQ 지수 정보 크롤링
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


class StockIndexCrawler:
    """주가지수 크롤링 클래스"""
    
    def __init__(self, timeout: int = TIMEOUT):
        """
        초기화
        
        Args:
            timeout: 요청 타임아웃 (초)
        """
        self.timeout = timeout
    
    def crawl_stock_index(self, mrkt_cls: str = None, search_date: Optional[str] = None) -> List[Dict]:
        """
        주가지수 데이터 크롤링
        
        Args:
            mrkt_cls: 시장 구분 (KOSPI 또는 KOSDAQ, None이면 둘 다)
            search_date: 조회 날짜 (YYYYMMDD 형식, None이면 오늘)
        
        Returns:
            주가지수 데이터 리스트
        """
        logger.info(f"[크롤링] 주가지수 데이터 수집 시작 - 시장: {mrkt_cls or '전체'}")
        
        indices = []
        
        if mrkt_cls is None or mrkt_cls.upper() == "KOSPI":
            logger.info("[크롤링] KOSPI 지수 크롤링 시도")
            kospi = self._crawl_kospi()
            if kospi:
                indices.extend(kospi)
        
        if mrkt_cls is None or mrkt_cls.upper() == "KOSDAQ":
            logger.info("[크롤링] KOSDAQ 지수 크롤링 시도")
            kosdaq = self._crawl_kosdaq()
            if kosdaq:
                indices.extend(kosdaq)
        
        if not indices:
            logger.warning(f"[크롤링] 주가지수 데이터를 찾을 수 없습니다. 시장: {mrkt_cls or '전체'}")
            return []
        
        logger.info(f"[크롤링] 주가지수 데이터 수집 완료 - 시장: {mrkt_cls or '전체'}, 개수: {len(indices)}")
        return indices
    
    def _crawl_kospi(self) -> List[Dict]:
        """KOSPI 지수 크롤링"""
        try:
            url = "https://finance.naver.com/sise/sise_index.naver?code=KOSPI"
            logger.info(f"[크롤링] 네이버 금융 KOSPI 페이지 접속 시도: {url}")
            
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            logger.debug("[크롤링] 네이버 KOSPI 페이지 로드 완료")
            
            # KOSPI 지수 정보 추출
            index_data = self._parse_index_page(soup, "KOSPI")
            if index_data:
                return [index_data]
            
            return []
            
        except Exception as e:
            logger.error(f"[크롤링] KOSPI 크롤링 실패: {str(e)}", exc_info=True)
            return []
    
    def _crawl_kosdaq(self) -> List[Dict]:
        """KOSDAQ 지수 크롤링"""
        try:
            url = "https://finance.naver.com/sise/sise_index.naver?code=KOSDAQ"
            logger.info(f"[크롤링] 네이버 금융 KOSDAQ 페이지 접속 시도: {url}")
            
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            logger.debug("[크롤링] 네이버 KOSDAQ 페이지 로드 완료")
            
            # KOSDAQ 지수 정보 추출
            index_data = self._parse_index_page(soup, "KOSDAQ")
            if index_data:
                return [index_data]
            
            return []
            
        except Exception as e:
            logger.error(f"[크롤링] KOSDAQ 크롤링 실패: {str(e)}", exc_info=True)
            return []
    
    def _parse_index_page(self, soup: BeautifulSoup, mrkt_cls: str) -> Optional[Dict]:
        """지수 페이지 파싱"""
        try:
            # 기준일 (오늘 날짜)
            bas_dt = datetime.now().strftime("%Y%m%d")
            
            # 지수명
            idx_nm = "코스피" if mrkt_cls == "KOSPI" else "코스닥"
            
            # 종가 추출 (여러 선택자 시도)
            clpr = None
            vs = None
            flt_rt = None
            
            # 방법 1: 현재가 추출
            selectors = [
                "#now_value",
                ".no_today .blind",
                ".no_today",
                "#_nowVal",
                ".sise_area .no_today",
                ".graph_info .no_today"
            ]
            
            for selector in selectors:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text(strip=True)
                    # 숫자만 추출 (쉼표 제거)
                    numbers = re.findall(r'[\d,]+\.?\d*', text)
                    if numbers:
                        clpr = numbers[0].replace(',', '')
                        break
            
            # 방법 2: 테이블에서 추출
            if not clpr:
                table = soup.select_one("table.tbl_type_1, table.type_1, table")
                if table:
                    rows = table.select("tr")
                    for row in rows:
                        cells = row.select("td, th")
                        for i, cell in enumerate(cells):
                            text = cell.get_text(strip=True)
                            if "현재가" in text or "종가" in text or "지수" in text:
                                if i + 1 < len(cells):
                                    value_text = cells[i + 1].get_text(strip=True)
                                    numbers = re.findall(r'[\d,]+\.?\d*', value_text)
                                    if numbers:
                                        clpr = numbers[0].replace(',', '')
                                        break
            
            # 전일 대비 추출
            change_selectors = [
                ".no_exday",
                ".no_exday .blind",
                "#change",
                ".change",
                ".sise_area .no_exday"
            ]
            
            for selector in change_selectors:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text(strip=True)
                    # + 또는 - 기호와 숫자 추출
                    match = re.search(r'([+-]?[\d,]+\.?\d*)', text)
                    if match:
                        vs = match.group(1).replace(',', '')
                        break
            
            # 등락률 추출
            rate_selectors = [
                ".no_exday .rate",
                ".rate",
                "#rate",
                ".sise_area .rate"
            ]
            
            for selector in rate_selectors:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text(strip=True)
                    # % 기호와 숫자 추출
                    match = re.search(r'([+-]?[\d,]+\.?\d*)%', text)
                    if match:
                        flt_rt = match.group(1).replace(',', '')
                        break
            
            # 등락률이 없으면 계산
            if clpr and vs and not flt_rt:
                try:
                    clpr_float = float(clpr)
                    vs_float = float(vs)
                    if clpr_float != 0:
                        flt_rt = str(round((vs_float / (clpr_float - vs_float)) * 100, 2))
                except:
                    pass
            
            if not clpr:
                logger.warning(f"[크롤링] {mrkt_cls} 지수 종가를 찾을 수 없습니다.")
                return None
            
            result = {
                "basDt": bas_dt,
                "idxNm": idx_nm,
                "clpr": clpr,
                "vs": vs or "0",
                "fltRt": flt_rt or "0",
                "mrktCls": mrkt_cls
            }
            
            logger.info(f"[크롤링] {mrkt_cls} 지수 파싱 성공 - 종가: {clpr}, 전일대비: {vs}, 등락률: {flt_rt}%")
            return result
            
        except Exception as e:
            logger.error(f"[크롤링] {mrkt_cls} 지수 파싱 실패: {str(e)}", exc_info=True)
            return None
