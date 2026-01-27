from pydantic import BaseModel
from typing import Optional


class FaceRegisterRequest(BaseModel):
    """얼굴 등록 요청"""
    image_base64: str  # Base64 인코딩된 이미지
    user_id: str  # 사용자 ID (필수)
    user_name: Optional[str] = None  # 사용자 이름 (선택)


class FaceRegisterResponse(BaseModel):
    """얼굴 등록 응답"""
    success: bool
    message: str
    face_detected: bool
    face_description: Optional[str] = None
    error: Optional[str] = None


class FaceRecognitionRequest(BaseModel):
    """얼굴 인식 요청"""
    image_base64: str  # Base64 인코딩된 이미지
    user_id: Optional[str] = None  # 사용자 ID (선택)


class FaceRecognitionResponse(BaseModel):
    """얼굴 인식 응답"""
    success: bool
    face_detected: bool
    face_count: int
    description: Optional[str] = None
    matched_user_id: Optional[str] = None  # 매칭된 사용자 ID
    matched_user_name: Optional[str] = None  # 매칭된 사용자 이름
    confidence: Optional[float] = None  # 매칭 신뢰도
    error: Optional[str] = None
