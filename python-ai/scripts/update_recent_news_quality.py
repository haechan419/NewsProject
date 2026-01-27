#!/usr/bin/env python3
"""
최근 N시간 내 수집된 뉴스에 대해 품질 점수를 설정하는 스크립트

사용법:
    python scripts/update_recent_news_quality.py [hours] [limit]

예시:
    python scripts/update_recent_news_quality.py 1 100  # 최근 1시간 내 100개
    python scripts/update_recent_news_quality.py 24 50  # 최근 24시간 내 50개
"""
import sys
import os
import requests
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.news_quality_service import NewsQualityService

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Java 백엔드 API URL (환경 변수에서 가져오거나 기본값 사용)
JAVA_BACKEND_URL = os.getenv("JAVA_BACKEND_URL", "http://localhost:8080")
PYTHON_API_URL = os.getenv("PYTHON_API_URL", "http://localhost:8000")


def get_recent_news_ids(hours: int = 1, limit: int = 100) -> List[int]:
    """
    데이터베이스에서 최근 N시간 내 수집된 뉴스 ID 목록을 가져옵니다.
    
    Args:
        hours: 몇 시간 전부터 조회할지
        limit: 최대 개수
        
    Returns:
        뉴스 ID 목록
    """
    return get_recent_news_ids_from_db(hours, limit)


def get_recent_news_ids_from_db(hours: int, limit: int) -> List[int]:
    """
    데이터베이스에서 직접 최근 N시간 내 뉴스 ID를 조회합니다.
    (pymysql 사용)
    """
    try:
        import pymysql
        
        # 데이터베이스 연결 정보 (환경 변수에서 가져오기)
        db_config = {
            "host": os.getenv("DB_HOST", "localhost"),
            "port": int(os.getenv("DB_PORT", "3306")),
            "user": os.getenv("DB_USER", "root"),
            "password": os.getenv("DB_PASSWORD", ""),
            "database": os.getenv("DB_NAME", "fullstc"),
            "charset": "utf8mb4"
        }
        
        connection = pymysql.connect(**db_config)
        
        try:
            with connection.cursor() as cursor:
                sql = """
                    SELECT id FROM news
                    WHERE fetched_at >= DATE_SUB(NOW(), INTERVAL %s HOUR)
                    ORDER BY fetched_at DESC
                    LIMIT %s
                """
                cursor.execute(sql, (hours, limit))
                results = cursor.fetchall()
                ids = [row[0] for row in results]
                
                logger.info(f"데이터베이스에서 조회된 뉴스 ID: {len(ids)}개")
                return ids
                
        finally:
            connection.close()
            
    except ImportError:
        logger.error("pymysql이 설치되지 않았습니다. 'pip install pymysql' 실행 필요")
        return []
    except Exception as e:
        logger.error(f"데이터베이스 조회 실패: {e}")
        return []


def get_news_data(news_ids: List[int]) -> List[Dict[str, Any]]:
    """
    뉴스 ID 목록에 해당하는 뉴스 데이터를 가져옵니다.
    """
    news_data = []
    
    try:
        import pymysql
        
        db_config = {
            "host": os.getenv("DB_HOST", "localhost"),
            "port": int(os.getenv("DB_PORT", "3306")),
            "user": os.getenv("DB_USER", "root"),
            "password": os.getenv("DB_PASSWORD", ""),
            "database": os.getenv("DB_NAME", "fullstc"),
            "charset": "utf8mb4"
        }
        
        connection = pymysql.connect(**db_config)
        
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                placeholders = ",".join(["%s"] * len(news_ids))
                sql = f"""
                    SELECT 
                        id,
                        title,
                        COALESCE(ai_summary, '') as ai_summary,
                        COALESCE(content, '') as content,
                        provider
                    FROM news
                    WHERE id IN ({placeholders})
                    AND (content IS NOT NULL AND content <> '')
                """
                cursor.execute(sql, news_ids)
                results = cursor.fetchall()
                
                for row in results:
                    # cross_source_count는 기본값 1로 설정
                    news_data.append({
                        "id": str(row["id"]),
                        "title": row["title"] or "",
                        "content": row["content"] or "",
                        "ai_summary": row["ai_summary"] or None,
                        "cross_source_count": 1
                    })
                
                logger.info(f"뉴스 데이터 조회 완료: {len(news_data)}개")
                
        finally:
            connection.close()
            
    except Exception as e:
        logger.error(f"뉴스 데이터 조회 실패: {e}")
    
    return news_data


def update_quality_scores(news_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    뉴스 데이터에 대해 품질 점수를 계산합니다.
    """
    if not news_data:
        logger.warning("분석할 뉴스 데이터가 없습니다.")
        return []
    
    logger.info(f"품질 분석 시작: {len(news_data)}개 기사")
    
    try:
        # NewsQualityService를 사용하여 배치 분석
        results = NewsQualityService.analyze_news_batch(news_data)
        logger.info(f"품질 분석 완료: {len(results)}개 결과")
        return results
        
    except Exception as e:
        logger.error(f"품질 분석 실패: {e}")
        return []


def save_quality_results(results: List[Dict[str, Any]]) -> bool:
    """
    품질 분석 결과를 데이터베이스에 직접 저장합니다.
    """
    if not results:
        logger.warning("저장할 결과가 없습니다.")
        return False
    
    try:
        import pymysql
        import json
        
        db_config = {
            "host": os.getenv("DB_HOST", "localhost"),
            "port": int(os.getenv("DB_PORT", "3306")),
            "user": os.getenv("DB_USER", "root"),
            "password": os.getenv("DB_PASSWORD", ""),
            "database": os.getenv("DB_NAME", "fullstc"),
            "charset": "utf8mb4"
        }
        
        connection = pymysql.connect(**db_config)
        
        try:
            with connection.cursor() as cursor:
                updated_count = 0
                
                for result in results:
                    news_id = result.get("news_id")
                    if not news_id:
                        continue
                    
                    # news_id가 문자열일 수 있으므로 정수로 변환
                    try:
                        news_id_int = int(news_id) if isinstance(news_id, str) else news_id
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid news_id: {news_id}")
                        continue
                    
                    quality_score = result.get("quality_score", 0)
                    risk_flags = result.get("risk_flags", [])
                    badge = result.get("badge", "❌")
                    evidence = result.get("evidence", [])
                    
                    # risk_flags를 JSON 문자열로 변환
                    risk_flags_json = json.dumps(risk_flags, ensure_ascii=False)
                    
                    # UPDATE 쿼리 실행
                    sql = """
                        UPDATE news
                        SET quality_score = %s,
                            risk_flags = %s,
                            badge = %s,
                            verified_at = NOW()
                        WHERE id = %s
                    """
                    
                    cursor.execute(sql, (quality_score, risk_flags_json, badge, news_id_int))
                    updated_count += cursor.rowcount
                
                connection.commit()
                logger.info(f"품질 점수 저장 완료: {updated_count}개 업데이트됨")
                return True
                
        finally:
            connection.close()
            
    except ImportError:
        logger.error("pymysql이 설치되지 않았습니다.")
        return False
    except Exception as e:
        logger.error(f"데이터베이스 저장 실패: {e}")
        return False


def main():
    """메인 함수"""
    # 명령줄 인자 파싱
    hours = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    
    logger.info(f"최근 {hours}시간 내 뉴스 품질 점수 설정 시작 (최대 {limit}개)")
    
    # 1. 최근 뉴스 ID 조회
    news_ids = get_recent_news_ids(hours, limit)
    
    if not news_ids:
        logger.warning("처리할 뉴스가 없습니다.")
        return
    
    # 2. 뉴스 데이터 조회
    news_data = get_news_data(news_ids)
    
    if not news_data:
        logger.warning("분석 가능한 뉴스 데이터가 없습니다. (content가 없는 뉴스는 제외됩니다)")
        return
    
    # 3. 품질 분석 수행
    results = update_quality_scores(news_data)
    
    if not results:
        logger.warning("품질 분석 결과가 없습니다.")
        return
    
    # 4. 결과 저장
    save_quality_results(results)
    
    logger.info("작업 완료!")


if __name__ == "__main__":
    main()
