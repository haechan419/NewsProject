"""
환율 API 테스트 및 디버깅 스크립트
"""
from exchange_rate import ExchangeRateClient
import json
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def test_api_response():
    """API 응답 구조 확인"""
    import requests
    
    client = ExchangeRateClient()
    
    # API 직접 호출하여 응답 구조 확인
    params = {
        "authkey": client.authkey,
        "searchdate": "20260203",
        "data": "AP01"
    }
    
    response = requests.get(client.BASE_URL, params=params, timeout=10)
    data = response.json()
    
    print("=" * 50)
    print("API 응답 구조 확인")
    print("=" * 50)
    print(f"응답 타입: {type(data)}")
    print(f"응답 개수: {len(data) if isinstance(data, list) else 'N/A'}")
    
    if isinstance(data, list) and len(data) > 0:
        print("\n첫 번째 항목:")
        print(json.dumps(data[0], indent=2, ensure_ascii=False))
        
        print("\n모든 항목의 CUR_UNIT:")
        for i, item in enumerate(data[:10]):
            print(f"  [{i}] CUR_UNIT: {item.get('CUR_UNIT')}, CUR_NM: {item.get('CUR_NM')}, RESULT: {item.get('RESULT')}")

def test_parsing():
    """파싱 테스트"""
    print("\n" + "=" * 50)
    print("파싱 테스트")
    print("=" * 50)
    
    client = ExchangeRateClient()
    
    try:
        rates = client.get_exchange_rates()
        print(f"\n파싱된 환율 개수: {len(rates)}")
        
        print("\n파싱된 환율 정보 (처음 10개):")
        for i, rate in enumerate(rates[:10]):
            print(f"  [{i}] {rate.cur_unit} - {rate.cur_nm}: {rate.deal_bas_r}")
        
        # 통화 코드별로 그룹화
        print("\n통화 코드별 통계:")
        currency_codes = {}
        for rate in rates:
            if rate.cur_unit:
                code = rate.cur_unit.upper()
                currency_codes[code] = currency_codes.get(code, 0) + 1
        
        for code, count in sorted(currency_codes.items()):
            print(f"  {code}: {count}개")
            
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_api_response()
    test_parsing()
