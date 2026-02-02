"""
금융 시장 데이터 수집 모듈
FinanceDataReader와 yfinance를 사용하여 코스피/코스닥 및 글로벌 지수 수집
"""
import yfinance as yf
import FinanceDataReader as fdr
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


def get_korean_indices() -> Dict:
    """
    한국 지수 데이터 수집 (코스피, 코스닥)
    
    Returns:
        Dict: 코스피와 코스닥 지수 데이터
    """
    try:
        # FinanceDataReader로 한국 지수 조회
        # KS11: 코스피, KQ11: 코스닥
        kospi = fdr.DataReader('KS11', datetime.now() - timedelta(days=2), datetime.now())
        kosdaq = fdr.DataReader('KQ11', datetime.now() - timedelta(days=2), datetime.now())
        
        result = {}
        
        # 코스피 데이터
        if not kospi.empty:
            latest_kospi = kospi.iloc[-1]
            prev_kospi = kospi.iloc[-2] if len(kospi) > 1 else latest_kospi
            
            kospi_value = float(latest_kospi['Close'])
            kospi_change = float(latest_kospi['Close'] - prev_kospi['Close'])
            kospi_change_percent = (kospi_change / prev_kospi['Close']) * 100 if prev_kospi['Close'] != 0 else 0.0
            
            result['kospi'] = {
                'value': round(kospi_value, 2),
                'change': round(kospi_change, 2),
                'changePercent': round(kospi_change_percent, 2),
                'updatedAt': latest_kospi.name.isoformat() if hasattr(latest_kospi.name, 'isoformat') else datetime.now().isoformat()
            }
        else:
            # 기본값
            result['kospi'] = {
                'value': 2500.0,
                'change': 0.0,
                'changePercent': 0.0,
                'updatedAt': datetime.now().isoformat()
            }
        
        # 코스닥 데이터
        if not kosdaq.empty:
            latest_kosdaq = kosdaq.iloc[-1]
            prev_kosdaq = kosdaq.iloc[-2] if len(kosdaq) > 1 else latest_kosdaq
            
            kosdaq_value = float(latest_kosdaq['Close'])
            kosdaq_change = float(latest_kosdaq['Close'] - prev_kosdaq['Close'])
            kosdaq_change_percent = (kosdaq_change / prev_kosdaq['Close']) * 100 if prev_kosdaq['Close'] != 0 else 0.0
            
            result['kosdaq'] = {
                'value': round(kosdaq_value, 2),
                'change': round(kosdaq_change, 2),
                'changePercent': round(kosdaq_change_percent, 2),
                'updatedAt': latest_kosdaq.name.isoformat() if hasattr(latest_kosdaq.name, 'isoformat') else datetime.now().isoformat()
            }
        else:
            # 기본값
            result['kosdaq'] = {
                'value': 800.0,
                'change': 0.0,
                'changePercent': 0.0,
                'updatedAt': datetime.now().isoformat()
            }
        
        logger.info(f"한국 지수 수집 완료: 코스피 {result['kospi']['value']}, 코스닥 {result['kosdaq']['value']}")
        return result
        
    except Exception as e:
        logger.error(f"한국 지수 수집 실패: {e}")
        # 기본값 반환
        return {
            'kospi': {
                'value': 2500.0,
                'change': 0.0,
                'changePercent': 0.0,
                'updatedAt': datetime.now().isoformat()
            },
            'kosdaq': {
                'value': 800.0,
                'change': 0.0,
                'changePercent': 0.0,
                'updatedAt': datetime.now().isoformat()
            }
        }


def get_global_indices() -> Dict:
    """
    글로벌 지수 데이터 수집 (S&P 500, NASDAQ, Dow Jones 등)
    yfinance 사용
    
    Returns:
        Dict: 글로벌 지수 데이터
    """
    try:
        result = {}
        
        # S&P 500 (^GSPC)
        sp500 = yf.Ticker("^GSPC")
        sp500_info = sp500.history(period="2d")
        
        if not sp500_info.empty:
            latest = sp500_info.iloc[-1]
            prev = sp500_info.iloc[-2] if len(sp500_info) > 1 else latest
            
            sp500_value = float(latest['Close'])
            sp500_change = float(latest['Close'] - prev['Close'])
            sp500_change_percent = (sp500_change / prev['Close']) * 100 if prev['Close'] != 0 else 0.0
            
            result['SPX'] = {
                'value': round(sp500_value, 2),
                'change': round(sp500_change, 2),
                'changePercent': round(sp500_change_percent, 2),
                'updatedAt': latest.name.isoformat() if hasattr(latest.name, 'isoformat') else datetime.now().isoformat()
            }
        
        # NASDAQ (^IXIC)
        nasdaq = yf.Ticker("^IXIC")
        nasdaq_info = nasdaq.history(period="2d")
        
        if not nasdaq_info.empty:
            latest = nasdaq_info.iloc[-1]
            prev = nasdaq_info.iloc[-2] if len(nasdaq_info) > 1 else latest
            
            nasdaq_value = float(latest['Close'])
            nasdaq_change = float(latest['Close'] - prev['Close'])
            nasdaq_change_percent = (nasdaq_change / prev['Close']) * 100 if prev['Close'] != 0 else 0.0
            
            result['NDX'] = {
                'value': round(nasdaq_value, 2),
                'change': round(nasdaq_change, 2),
                'changePercent': round(nasdaq_change_percent, 2),
                'updatedAt': latest.name.isoformat() if hasattr(latest.name, 'isoformat') else datetime.now().isoformat()
            }
        
        # Dow Jones (^DJI)
        dow = yf.Ticker("^DJI")
        dow_info = dow.history(period="2d")
        
        if not dow_info.empty:
            latest = dow_info.iloc[-1]
            prev = dow_info.iloc[-2] if len(dow_info) > 1 else latest
            
            dow_value = float(latest['Close'])
            dow_change = float(latest['Close'] - prev['Close'])
            dow_change_percent = (dow_change / prev['Close']) * 100 if prev['Close'] != 0 else 0.0
            
            result['DJI'] = {
                'value': round(dow_value, 2),
                'change': round(dow_change, 2),
                'changePercent': round(dow_change_percent, 2),
                'updatedAt': latest.name.isoformat() if hasattr(latest.name, 'isoformat') else datetime.now().isoformat()
            }
        
        logger.info(f"글로벌 지수 수집 완료: {list(result.keys())}")
        return result
        
    except Exception as e:
        logger.error(f"글로벌 지수 수집 실패: {e}")
        return {}


if __name__ == "__main__":
    # 테스트 코드
    logging.basicConfig(level=logging.INFO)
    
    print("=== 한국 지수 ===")
    korean = get_korean_indices()
    print(korean)
    
    print("\n=== 글로벌 지수 ===")
    global_indices = get_global_indices()
    print(global_indices)
