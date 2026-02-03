"""
한국수출입은행 환율 API 클라이언트
공공데이터포털 환율 정보 조회
"""
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from dataclasses import dataclass
from decimal import Decimal

logger = logging.getLogger(__name__)


@dataclass
class ExchangeRate:
    """환율 정보 데이터 클래스"""
    cur_unit: str  # 통화 코드 (USD, JPY 등)
    cur_nm: str    # 국가/통화명
    deal_bas_r: Optional[Decimal]  # 매매 기준율
    ttb: Optional[Decimal]  # 송금 받으실 때
    tts: Optional[Decimal]  # 송금 보내실 때
    bkpr: Optional[Decimal]  # 장부가격


class ExchangeRateClient:
    """한국수출입은행 환율 API 클라이언트"""
    
    BASE_URL = "https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON"
    DEFAULT_AUTHKEY = "1bjMCNYULSX7JIDQjeheZpNEHchcTF51"
    
    def __init__(self, authkey: Optional[str] = None):
        """
        초기화
        
        Args:
            authkey: API 인증 키 (기본값 사용 가능)
        """
        self.authkey = authkey or self.DEFAULT_AUTHKEY
    
    def get_exchange_rates(
        self, 
        search_date: Optional[str] = None,
        data: str = "AP01"
    ) -> List[ExchangeRate]:
        """
        환율 데이터 조회
        
        Args:
            search_date: 조회 날짜 (yyyyMMdd 형식, None이면 당일)
            data: 데이터 타입 (AP01: 환율, AP02: 대출금리, AP03: 국제금리)
        
        Returns:
            환율 정보 리스트
        
        Raises:
            ValueError: API 응답 오류 시
            requests.RequestException: 네트워크 오류 시
        """
        try:
            # 날짜 설정
            if search_date is None:
                search_date = datetime.now().strftime("%Y%m%d")
            
            # 날짜 형식 검증
            try:
                datetime.strptime(search_date, "%Y%m%d")
            except ValueError:
                raise ValueError(f"날짜 형식이 올바르지 않습니다. yyyyMMdd 형식이어야 합니다: {search_date}")
            
            logger.info(f"환율 API 호출 시작 - 날짜: {search_date}")
            
            # API 요청 파라미터
            params = {
                "authkey": self.authkey,
                "searchdate": search_date,
                "data": data
            }
            
            # API 호출
            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            
            # JSON 응답 파싱
            data_list = response.json()
            
            if not isinstance(data_list, list):
                raise ValueError(f"API 응답 형식이 올바르지 않습니다: {type(data_list)}")
            
            if not data_list:
                logger.warning(f"환율 데이터가 없습니다. 날짜: {search_date} (비영업일이거나 오전 11시 이전일 수 있습니다)")
                return []
            
            # ExchangeRate 객체로 변환
            exchange_rates = []
            for item in data_list:
                # 대소문자 모두 지원
                result_code = item.get("RESULT") or item.get("result")
                
                # RESULT 필드가 있고 1이 아닌 경우 스킵 (에러 응답)
                if result_code is not None and result_code != 1:
                    logger.debug(f"결과 코드가 1이 아닌 항목 스킵: {item}")
                    continue
                
                # CUR_UNIT이 없는 경우 스킵 (에러 응답 또는 메타데이터)
                cur_unit = item.get("CUR_UNIT") or item.get("cur_unit")
                if not cur_unit:
                    continue
                
                try:
                    exchange_rate = self._parse_exchange_rate(item)
                    if exchange_rate and exchange_rate.cur_unit:  # cur_unit이 있는 경우만 추가
                        exchange_rates.append(exchange_rate)
                except Exception as e:
                    logger.warning(f"환율 데이터 파싱 실패: {item}, 오류: {e}")
                    continue
            
            logger.info(f"환율 API 호출 성공 - 데이터 개수: {len(exchange_rates)}")
            return exchange_rates
            
        except requests.exceptions.Timeout:
            error_msg = "API 호출 시간 초과"
            logger.error(error_msg)
            raise requests.RequestException(error_msg)
        except requests.exceptions.RequestException as e:
            error_msg = f"API 호출 실패: {str(e)}"
            logger.error(error_msg)
            raise requests.RequestException(error_msg)
        except ValueError as e:
            logger.error(f"값 오류: {str(e)}")
            raise
        except Exception as e:
            error_msg = f"예상치 못한 오류 발생: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise Exception(error_msg)
    
    def _parse_exchange_rate(self, item: Dict) -> Optional[ExchangeRate]:
        """
        API 응답 항목을 ExchangeRate 객체로 변환
        
        Args:
            item: API 응답 딕셔너리
        
        Returns:
            ExchangeRate 객체 또는 None
        """
        try:
            # 문자열을 Decimal로 변환 (쉼표 제거)
            def parse_decimal(value: Optional[str]) -> Optional[Decimal]:
                if value is None or value == "":
                    return None
                try:
                    # 쉼표 제거 후 변환
                    cleaned = str(value).replace(",", "").strip()
                    if cleaned == "":
                        return None
                    return Decimal(cleaned)
                except (ValueError, TypeError):
                    logger.warning(f"숫자 변환 실패: {value}")
                    return None
            
            # 대소문자 모두 지원 (API 응답이 소문자일 수 있음)
            def get_field(item: Dict, *keys) -> Optional[str]:
                """여러 키를 시도하여 값 찾기"""
                for key in keys:
                    value = item.get(key)
                    if value is not None and value != "":
                        return str(value)
                return None
            
            cur_unit = get_field(item, "CUR_UNIT", "cur_unit") or ""
            cur_nm = get_field(item, "CUR_NM", "cur_nm") or ""
            
            # cur_unit이 없으면 None 반환
            if not cur_unit:
                return None
            
            return ExchangeRate(
                cur_unit=cur_unit,
                cur_nm=cur_nm,
                deal_bas_r=parse_decimal(get_field(item, "DEAL_BAS_R", "deal_bas_r")),
                ttb=parse_decimal(get_field(item, "TTB", "ttb")),
                tts=parse_decimal(get_field(item, "TTS", "tts")),
                bkpr=parse_decimal(get_field(item, "BKPR", "bkpr"))
            )
        except Exception as e:
            logger.error(f"환율 데이터 파싱 중 오류: {item}, 오류: {e}")
            return None
    
    def get_exchange_rate_by_currency(
        self, 
        cur_unit: str,
        search_date: Optional[str] = None
    ) -> Optional[ExchangeRate]:
        """
        특정 통화의 환율 조회
        
        Args:
            cur_unit: 통화 코드 (USD, JPY 등)
            search_date: 조회 날짜 (yyyyMMdd 형식, None이면 당일)
        
        Returns:
            ExchangeRate 객체 또는 None
        """
        exchange_rates = self.get_exchange_rates(search_date)
        
        cur_unit_upper = cur_unit.upper().strip()
        
        for rate in exchange_rates:
            if not rate.cur_unit:
                continue
                
            # 통화 코드에서 괄호 제거 후 비교 (예: "JPY(100)" -> "JPY")
            rate_code = rate.cur_unit.upper().strip()
            # 괄호와 그 안의 내용 제거
            rate_code_clean = rate_code.split('(')[0].strip()
            
            # 정확히 일치하는 경우
            if rate_code_clean == cur_unit_upper:
                return rate
            
            # 통화 코드가 포함된 경우 (예: "JPY(100)"에서 "JPY" 찾기)
            if rate_code_clean.startswith(cur_unit_upper) or cur_unit_upper.startswith(rate_code_clean):
                return rate
        
        # 디버깅: 실제 통화 코드 목록 출력
        logger.debug(f"조회된 통화 코드 목록: {[r.cur_unit for r in exchange_rates if r.cur_unit]}")
        
        return None


def main():
    """테스트 코드"""
    import json
    
    # 로깅 설정
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # 클라이언트 생성
    client = ExchangeRateClient()
    
    try:
        # 1. 당일 환율 조회
        print("=== 당일 환율 조회 ===")
        exchange_rates = client.get_exchange_rates()
        
        if exchange_rates:
            print(f"조회된 환율 개수: {len(exchange_rates)}")
            for rate in exchange_rates[:5]:  # 처음 5개만 출력
                print(f"\n통화 코드: {rate.cur_unit}")
                print(f"통화명: {rate.cur_nm}")
                print(f"매매 기준율: {rate.deal_bas_r}")
                print(f"송금 받을 때: {rate.ttb}")
                print(f"송금 보낼 때: {rate.tts}")
        else:
            print("환율 데이터가 없습니다.")
        
        # 2. 특정 날짜 환율 조회
        print("\n=== 특정 날짜 환율 조회 (20260203) ===")
        specific_date = "20260203"
        try:
            rates = client.get_exchange_rates(specific_date)
            print(f"조회된 환율 개수: {len(rates)}")
        except Exception as e:
            print(f"오류 발생: {e}")
        
        # 3. 특정 통화 환율 조회
        print("\n=== USD 환율 조회 ===")
        usd_rate = client.get_exchange_rate_by_currency("USD")
        if usd_rate:
            print(f"통화명: {usd_rate.cur_nm}")
            print(f"매매 기준율: {usd_rate.deal_bas_r}")
        else:
            print("USD 환율 정보를 찾을 수 없습니다.")
        
        # 4. JPY 환율 조회
        print("\n=== JPY 환율 조회 ===")
        jpy_rate = client.get_exchange_rate_by_currency("JPY")
        if jpy_rate:
            print(f"통화명: {jpy_rate.cur_nm}")
            print(f"매매 기준율: {jpy_rate.deal_bas_r}")
        else:
            print("JPY 환율 정보를 찾을 수 없습니다.")
            
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
