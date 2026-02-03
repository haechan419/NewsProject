"""
한국수출입은행 환율 API 사용 예제
"""
from exchange_rate import ExchangeRateClient
from datetime import datetime, timedelta
import logging
import sys
import io

# Windows 콘솔 인코딩 설정
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def example_basic_usage():
    """기본 사용 예제"""
    print("=" * 50)
    print("기본 사용 예제")
    print("=" * 50)
    
    # 클라이언트 생성 (기본 인증 키 사용)
    client = ExchangeRateClient()
    
    # 당일 환율 조회
    try:
        rates = client.get_exchange_rates()
        print(f"\n[성공] 당일 환율 조회 성공: {len(rates)}개")
        
        # 주요 통화만 출력
        major_currencies = ["USD", "JPY", "EUR", "CNY", "GBP"]
        found_currencies = []
        for rate in rates:
            if rate.cur_unit and rate.cur_unit.upper() in [c.upper() for c in major_currencies]:
                print(f"  {rate.cur_unit:4s} ({rate.cur_nm:20s}): {rate.deal_bas_r:>10}")
                found_currencies.append(rate.cur_unit)
        
        # 찾지 못한 통화 출력
        not_found = [c for c in major_currencies if c.upper() not in [fc.upper() for fc in found_currencies]]
        if not_found:
            print(f"\n  [경고] 다음 통화를 찾을 수 없습니다: {', '.join(not_found)}")
            print(f"  실제 조회된 통화 코드: {[r.cur_unit for r in rates[:10] if r.cur_unit]}")
    except Exception as e:
        print(f"[오류] 오류 발생: {e}")


def example_specific_date():
    """특정 날짜 조회 예제"""
    print("\n" + "=" * 50)
    print("특정 날짜 조회 예제")
    print("=" * 50)
    
    client = ExchangeRateClient()
    
    # 어제 날짜 계산
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
    
    try:
        rates = client.get_exchange_rates(yesterday)
        print(f"\n[성공] {yesterday} 환율 조회 성공: {len(rates)}개")
        
        if rates:
            print("\n주요 통화:")
            for rate in rates[:10]:  # 10개까지 출력
                if rate.cur_unit:  # cur_unit이 있는 경우만 출력
                    print(f"  {rate.cur_unit}: {rate.cur_nm} - {rate.deal_bas_r}")
    except Exception as e:
        print(f"[오류] 오류 발생: {e}")


def example_specific_currency():
    """특정 통화 조회 예제"""
    print("\n" + "=" * 50)
    print("특정 통화 조회 예제")
    print("=" * 50)
    
    client = ExchangeRateClient()
    
    currencies = ["USD", "JPY", "EUR", "CNY", "GBP"]
    
    for cur_unit in currencies:
        try:
            rate = client.get_exchange_rate_by_currency(cur_unit)
            if rate:
                print(f"\n[성공] {cur_unit} 환율 정보:")
                print(f"  통화명: {rate.cur_nm}")
                print(f"  매매 기준율: {rate.deal_bas_r}")
                print(f"  송금 받을 때: {rate.ttb}")
                print(f"  송금 보낼 때: {rate.tts}")
            else:
                print(f"[경고] {cur_unit} 환율 정보를 찾을 수 없습니다.")
        except Exception as e:
            print(f"[오류] {cur_unit} 조회 중 오류: {e}")


def example_error_handling():
    """에러 처리 예제"""
    print("\n" + "=" * 50)
    print("에러 처리 예제")
    print("=" * 50)
    
    client = ExchangeRateClient()
    
    # 잘못된 날짜 형식
    print("\n1. 잘못된 날짜 형식 테스트:")
    try:
        client.get_exchange_rates("2026-02-03")  # 잘못된 형식
    except ValueError as e:
        print(f"  [성공] 예상된 오류 처리: {e}")
    
    # 존재하지 않는 날짜
    print("\n2. 미래 날짜 테스트:")
    try:
        future_date = (datetime.now() + timedelta(days=30)).strftime("%Y%m%d")
        rates = client.get_exchange_rates(future_date)
        print(f"  결과: {len(rates)}개 (데이터가 없을 수 있음)")
    except Exception as e:
        print(f"  [성공] 예상된 오류 처리: {e}")
    
    # 존재하지 않는 통화
    print("\n3. 존재하지 않는 통화 테스트:")
    try:
        rate = client.get_exchange_rate_by_currency("XXX")
        if rate is None:
            print("  [성공] None 반환 (정상 처리)")
    except Exception as e:
        print(f"  오류: {e}")


def example_custom_authkey():
    """커스텀 인증 키 사용 예제"""
    print("\n" + "=" * 50)
    print("커스텀 인증 키 사용 예제")
    print("=" * 50)
    
    # 환경 변수나 설정 파일에서 읽어올 수 있음
    custom_authkey = "1bjMCNYULSX7JIDQjeheZpNEHchcTF51"  # 실제로는 환경 변수에서 읽기
    
    client = ExchangeRateClient(authkey=custom_authkey)
    
    try:
        rates = client.get_exchange_rates()
        print(f"\n[성공] 커스텀 키로 조회 성공: {len(rates)}개")
    except Exception as e:
        print(f"[오류] 오류 발생: {e}")


if __name__ == "__main__":
    # 모든 예제 실행
    example_basic_usage()
    example_specific_date()
    example_specific_currency()
    example_error_handling()
    example_custom_authkey()
    
    print("\n" + "=" * 50)
    print("모든 예제 실행 완료")
    print("=" * 50)
