from fastapi import APIRouter, HTTPException
import base64
import logging
import shutil
from io import BytesIO
from PIL import Image
from models import (
    FaceRegisterRequest,
    FaceRegisterResponse,
    FaceRecognitionRequest,
    FaceRecognitionResponse
)
from services.face_recognition import (
    analyze_face_with_openai,
    save_face_data,
    load_face_data,
    compare_faces,
    find_matching_user
)
from config import FACE_DATA_DIR

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/face", tags=["face"])


@router.post("/register", response_model=FaceRegisterResponse)
async def register_face(request: FaceRegisterRequest):
    """
    얼굴 등록 엔드포인트
    
    - image_base64: Base64 인코딩된 얼굴 이미지
    - user_id: 사용자 ID (필수)
    - user_name: 사용자 이름 (선택)
    """
    logger.info(f"얼굴 등록 요청 수신: user_id={request.user_id}")
    
    try:
        # 입력 데이터 검증
        if not request.image_base64:
            logger.error("이미지 데이터가 없습니다.")
            return FaceRegisterResponse(
                success=False,
                message="이미지 데이터가 필요합니다.",
                face_detected=False,
                error="Missing image data"
            )
        
        if not request.user_id:
            logger.error("사용자 ID가 없습니다.")
            return FaceRegisterResponse(
                success=False,
                message="사용자 ID가 필요합니다.",
                face_detected=False,
                error="Missing user_id"
            )
        
        # Base64에서 이미지 데이터 추출
        if "," in request.image_base64:
            image_base64 = request.image_base64.split(",")[1]
        else:
            image_base64 = request.image_base64
        
        logger.info(f"이미지 데이터 길이: {len(image_base64)}")
        
        # 이미지 디코딩 및 검증
        try:
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data))
        except Exception as decode_err:
            logger.error(f"이미지 디코딩 에러: {str(decode_err)}")
            return FaceRegisterResponse(
                success=False,
                message="이미지 디코딩에 실패했습니다. 올바른 이미지 파일인지 확인해주세요.",
                face_detected=False,
                error=f"Image decode error: {str(decode_err)}"
            )
        
        # 이미지를 PNG로 변환하여 Base64 재인코딩 (OpenAI API용)
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        image_base64_png = base64.b64encode(buffered.getvalue()).decode()
        
        # 이미지 크기 확인
        image_size = len(image_base64_png)
        logger.info(f"이미지 Base64 크기: {image_size} bytes ({image_size / 1024:.2f} KB)")
        
        # OpenAI Vision API로 얼굴 분석
        logger.info("OpenAI 얼굴 분석 시작...")
        analysis_result = analyze_face_with_openai(image_base64_png)
        logger.info(f"얼굴 분석 결과: {analysis_result}")
        
        # 분석 결과 상세 로깅
        logger.info(f"face_detected: {analysis_result.get('face_detected')}, face_count: {analysis_result.get('face_count')}")
        
        face_detected = analysis_result.get("face_detected", False)
        face_count = analysis_result.get("face_count", 0)
        face_description = analysis_result.get("face_description", "")
        
        if not face_detected or face_count == 0:
            return FaceRegisterResponse(
                success=False,
                message="이미지에서 얼굴을 감지할 수 없습니다. 얼굴이 명확하게 보이는 사진을 업로드해주세요.",
                face_detected=False,
                error="No face detected"
            )
        
        if face_count > 1:
            return FaceRegisterResponse(
                success=False,
                message="이미지에 여러 얼굴이 감지되었습니다. 한 명의 얼굴만 보이는 사진을 업로드해주세요.",
                face_detected=True,
                error="Multiple faces detected"
            )
        
        # 얼굴 데이터 저장
        save_face_data(
            user_id=request.user_id,
            user_name=request.user_name,
            image_base64=image_base64_png,
            face_description=face_description
        )
        
        logger.info(f"얼굴 등록 완료: user_id={request.user_id}")
        
        return FaceRegisterResponse(
            success=True,
            message="얼굴 등록이 완료되었습니다.",
            face_detected=True,
            face_description=face_description
        )
        
    except Exception as e:
        logger.error(f"얼굴 등록 에러: {str(e)}")
        return FaceRegisterResponse(
            success=False,
            message=f"얼굴 등록 중 오류가 발생했습니다: {str(e)}",
            face_detected=False,
            error=str(e)
        )


@router.post("/recognize", response_model=FaceRecognitionResponse)
async def recognize_face(request: FaceRecognitionRequest):
    """
    얼굴 인식 엔드포인트
    
    - image_base64: Base64 인코딩된 얼굴 이미지
    - user_id: 사용자 ID (선택, 특정 사용자와 비교할 때 사용)
    """
    logger.info("얼굴 인식 요청 수신")
    
    try:
        # Base64에서 이미지 데이터 추출
        if "," in request.image_base64:
            image_base64 = request.image_base64.split(",")[1]
        else:
            image_base64 = request.image_base64
        
        # 이미지 디코딩
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        
        # 이미지를 PNG로 변환하여 Base64 재인코딩
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        image_base64_png = base64.b64encode(buffered.getvalue()).decode()
        
        # OpenAI Vision API로 얼굴 분석
        analysis_result = analyze_face_with_openai(image_base64_png)
        
        face_detected = analysis_result.get("face_detected", False)
        face_count = analysis_result.get("face_count", 0)
        face_description = analysis_result.get("face_description", "")
        
        if not face_detected:
            return FaceRecognitionResponse(
                success=True,
                face_detected=False,
                face_count=0,
                description="이미지에서 얼굴을 감지할 수 없습니다."
            )
        
        # 특정 사용자와 비교하는 경우
        if request.user_id:
            saved_data = load_face_data(request.user_id)
            if saved_data:
                saved_description = saved_data.get("face_description", "")
                confidence = compare_faces(face_description, saved_description)
                
                return FaceRecognitionResponse(
                    success=True,
                    face_detected=True,
                    face_count=face_count,
                    description=face_description,
                    matched_user_id=request.user_id if confidence >= 0.3 else None,
                    matched_user_name=saved_data.get("user_name") if confidence >= 0.3 else None,
                    confidence=confidence
                )
        
        # 등록된 모든 얼굴과 비교
        matched_user = find_matching_user(face_description)
        
        return FaceRecognitionResponse(
            success=True,
            face_detected=True,
            face_count=face_count,
            description=face_description,
            matched_user_id=matched_user.get("user_id") if matched_user else None,
            matched_user_name=matched_user.get("user_name") if matched_user else None,
            confidence=matched_user.get("confidence") if matched_user else None
        )
        
    except Exception as e:
        logger.error(f"얼굴 인식 에러: {str(e)}")
        return FaceRecognitionResponse(
            success=False,
            face_detected=False,
            face_count=0,
            error=str(e)
        )


@router.delete("/{user_id}")
async def delete_face(user_id: str):
    """
    등록된 얼굴 삭제 엔드포인트
    """
    try:
        user_dir = FACE_DATA_DIR / user_id
        if not user_dir.exists():
            raise HTTPException(status_code=404, detail="등록된 얼굴을 찾을 수 없습니다.")
        
        # 디렉토리와 모든 파일 삭제
        shutil.rmtree(user_dir)
        
        logger.info(f"얼굴 데이터 삭제 완료: {user_id}")
        
        return {
            "success": True,
            "message": "얼굴 데이터가 삭제되었습니다."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"얼굴 삭제 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"얼굴 삭제 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/{user_id}")
async def get_face_info(user_id: str):
    """
    등록된 얼굴 정보 조회 엔드포인트
    """
    try:
        metadata = load_face_data(user_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="등록된 얼굴을 찾을 수 없습니다.")
        
        # 이미지 경로는 제외하고 메타데이터만 반환
        response = {
            "user_id": metadata.get("user_id"),
            "user_name": metadata.get("user_name"),
            "face_description": metadata.get("face_description"),
            "registered": True
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"얼굴 정보 조회 에러: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"얼굴 정보 조회 중 오류가 발생했습니다: {str(e)}"
        )
