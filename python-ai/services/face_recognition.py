import os
import json
import base64
import logging
from io import BytesIO
from pathlib import Path
from typing import Optional, Dict
from PIL import Image
from openai import OpenAI
from config import OPENAI_API_KEY, FACE_DATA_DIR
from prompts import FACE_ANALYSIS_PROMPT

logger = logging.getLogger(__name__)

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=OPENAI_API_KEY)


def analyze_face_with_openai(image_base64: str) -> dict:
    """OpenAI Vision API를 사용하여 얼굴 분석"""
    try:
        # 프롬프트에 JSON 형식 명시 추가
        json_prompt = FACE_ANALYSIS_PROMPT + "\n\n반드시 유효한 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요."
        
        response = client.chat.completions.create(
            model="gpt-4o",  # Vision 지원 모델
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": json_prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500,
            response_format={"type": "json_object"},
            temperature=0.1  # 일관된 응답을 위해 낮은 temperature 설정
        )
        
        # 응답 내용 확인
        if not response.choices or len(response.choices) == 0:
            logger.error("OpenAI 응답에 choices가 없습니다")
            logger.error(f"전체 응답: {response}")
            return {
                "face_detected": False,
                "face_count": 0,
                "face_description": "",
                "quality": "poor"
            }
        
        choice = response.choices[0]
        message = choice.message
        message_content = message.content
        finish_reason = choice.finish_reason
        
        # 응답 상세 정보 로깅
        logger.info(f"OpenAI 응답 - finish_reason: {finish_reason}, content type: {type(message_content)}")
        
        # None 체크
        if message_content is None:
            logger.error(f"OpenAI 응답 content가 None입니다. finish_reason: {finish_reason}")
            logger.error(f"전체 응답 객체: {response}")
            logger.error(f"Choice 객체: {choice}")
            logger.error(f"Message 객체: {message}")
            
            # finish_reason이 content_filter인 경우 처리
            if finish_reason == "content_filter":
                logger.error("콘텐츠 필터에 의해 응답이 차단되었습니다.")
            elif finish_reason == "length":
                logger.error("응답 길이 제한에 도달했습니다.")
            elif finish_reason == "stop":
                logger.error("응답이 정상적으로 종료되었지만 content가 None입니다.")
            
            return {
                "face_detected": False,
                "face_count": 0,
                "face_description": "",
                "quality": "poor"
            }
        
        # JSON 파싱
        try:
            result = json.loads(message_content)
            logger.info(f"얼굴 분석 결과: {result}")
            
            # 결과 검증 및 기본값 보정
            if "face_detected" not in result:
                logger.warning("face_detected 필드가 없습니다. 기본값으로 설정합니다.")
                result["face_detected"] = result.get("face_count", 0) > 0
            
            if "face_count" not in result:
                logger.warning("face_count 필드가 없습니다. 기본값으로 설정합니다.")
                result["face_count"] = 1 if result.get("face_detected", False) else 0
            
            # face_count가 0보다 크면 face_detected는 true여야 함
            if result.get("face_count", 0) > 0 and not result.get("face_detected", False):
                logger.warning("face_count > 0인데 face_detected가 false입니다. face_detected를 true로 수정합니다.")
                result["face_detected"] = True
            
            # face_detected가 true인데 face_count가 0이면 수정
            if result.get("face_detected", False) and result.get("face_count", 0) == 0:
                logger.warning("face_detected가 true인데 face_count가 0입니다. face_count를 1로 수정합니다.")
                result["face_count"] = 1
            
            logger.info(f"검증 후 얼굴 분석 결과: {result}")
            return result
            
        except json.JSONDecodeError as json_err:
            logger.error(f"JSON 파싱 에러: {str(json_err)}")
            logger.error(f"원본 내용 (처음 500자): {message_content[:500] if message_content else 'None'}")
            
            # JSON 파싱 실패 시 텍스트에서 JSON 부분만 추출 시도
            try:
                import re
                # 더 포괄적인 JSON 패턴 찾기
                json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', message_content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    logger.info(f"정규식으로 추출한 JSON: {json_str}")
                    result = json.loads(json_str)
                    logger.info(f"정규식으로 추출한 JSON 파싱 성공: {result}")
                    return result
            except Exception as extract_err:
                logger.error(f"JSON 추출 시도 실패: {str(extract_err)}")
            
            # JSON 파싱 실패 시에도 원본 내용에서 얼굴 관련 키워드 확인
            if message_content:
                message_lower = message_content.lower()
                if any(keyword in message_lower for keyword in ['face', '얼굴', 'person', '사람', 'detected', 'true']):
                    logger.warning("JSON 파싱 실패했지만 응답에 얼굴 관련 키워드가 있습니다. 얼굴이 감지된 것으로 간주합니다.")
                    return {
                        "face_detected": True,
                        "face_count": 1,
                        "face_description": "JSON 파싱 실패로 인한 기본값",
                        "quality": "fair"
                    }
            
            # JSON 파싱 실패 시 기본값 반환
            logger.error("JSON 파싱 실패 및 얼굴 키워드도 없음. 얼굴 미감지로 처리합니다.")
            return {
                "face_detected": False,
                "face_count": 0,
                "face_description": "",
                "quality": "poor"
            }
        
    except Exception as e:
        logger.error(f"OpenAI 얼굴 분석 에러: {str(e)}")
        logger.error(f"에러 타입: {type(e).__name__}")
        import traceback
        logger.error(f"트레이스백: {traceback.format_exc()}")
        # 에러 발생 시 기본값 반환
        return {
            "face_detected": False,
            "face_count": 0,
            "face_description": "",
            "quality": "poor"
        }


def save_face_data(user_id: str, user_name: Optional[str], image_base64: str, face_description: str):
    """얼굴 데이터를 파일로 저장"""
    try:
        user_dir = FACE_DATA_DIR / user_id
        user_dir.mkdir(exist_ok=True)
        
        # 이미지 저장
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        image_path = user_dir / "face_image.png"
        image.save(image_path, "PNG")
        
        # 메타데이터 저장
        metadata = {
            "user_id": user_id,
            "user_name": user_name,
            "face_description": face_description,
            "image_path": str(image_path)
        }
        
        metadata_path = user_dir / "metadata.json"
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        logger.info(f"얼굴 데이터 저장 완료: {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"얼굴 데이터 저장 에러: {str(e)}")
        raise


def load_face_data(user_id: str) -> Optional[dict]:
    """저장된 얼굴 데이터 로드"""
    try:
        metadata_path = FACE_DATA_DIR / user_id / "metadata.json"
        if not metadata_path.exists():
            return None
        
        with open(metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        
        return metadata
        
    except Exception as e:
        logger.error(f"얼굴 데이터 로드 에러: {str(e)}")
        return None


def compare_faces(new_description: str, saved_description: str) -> float:
    """두 얼굴 설명을 비교하여 유사도 반환 (간단한 휴리스틱)"""
    # 실제로는 더 정교한 비교 알고리즘이 필요하지만, 
    # 여기서는 간단한 키워드 매칭으로 구현
    new_words = set(new_description.lower().split())
    saved_words = set(saved_description.lower().split())
    
    if len(saved_words) == 0:
        return 0.0
    
    common_words = new_words.intersection(saved_words)
    similarity = len(common_words) / max(len(new_words), len(saved_words))
    
    return similarity


def find_matching_user(face_description: str) -> Optional[dict]:
    """등록된 얼굴 중에서 매칭되는 사용자 찾기"""
    best_match = None
    best_confidence = 0.0
    
    # 모든 사용자 디렉토리 검색
    for user_dir in FACE_DATA_DIR.iterdir():
        if not user_dir.is_dir():
            continue
        
        metadata = load_face_data(user_dir.name)
        if not metadata:
            continue
        
        saved_description = metadata.get("face_description", "")
        confidence = compare_faces(face_description, saved_description)
        
        if confidence > best_confidence:
            best_confidence = confidence
            best_match = {
                "user_id": metadata.get("user_id"),
                "user_name": metadata.get("user_name"),
                "confidence": confidence
            }
    
    # 신뢰도가 0.3 이상일 때만 매칭으로 간주
    if best_confidence >= 0.3:
        return best_match
    
    return None
