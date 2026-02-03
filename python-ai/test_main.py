"""
AI 얼굴 인식 API 테스트
pytest를 사용한 FastAPI 테스트
"""
import pytest
import base64
import json
from pathlib import Path
from fastapi.testclient import TestClient
from main import app

# 테스트 클라이언트 생성
client = TestClient(app)

# 테스트용 Base64 이미지 (1x1 픽셀 투명 PNG)
TEST_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

# 테스트용 사용자 정보
TEST_USER_ID = "pytest@test.com"
TEST_USER_NAME = "PyTestUser"


class TestHealthCheck:
    """헬스 체크 API 테스트"""

    def test_root_endpoint(self):
        """루트 엔드포인트 테스트"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "status" in data
        assert data["status"] == "active"

    def test_health_endpoint(self):
        """헬스 체크 엔드포인트 테스트"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestFaceRegistration:
    """얼굴 등록 API 테스트"""

    def test_register_face_success(self):
        """얼굴 등록 성공 테스트"""
        payload = {
            "image_base64": TEST_IMAGE_BASE64,
            "user_id": TEST_USER_ID,
            "user_name": TEST_USER_NAME
        }
        
        response = client.post("/face/register", json=payload)
        
        # 상태 코드 확인
        assert response.status_code == 200
        
        # 응답 데이터 확인
        data = response.json()
        assert "success" in data
        assert "message" in data
        assert "face_detected" in data
        
        print(f"[성공] 얼굴 등록 성공: {data}")

    def test_register_face_no_image(self):
        """이미지 없이 얼굴 등록 시도 - 실패 테스트"""
        payload = {
            "image_base64": "",
            "user_id": TEST_USER_ID,
            "user_name": TEST_USER_NAME
        }
        
        response = client.post("/face/register", json=payload)
        
        # 에러 응답 확인 (422 또는 400)
        assert response.status_code in [400, 422]
        
        print(f"[성공] 이미지 없음 검증 성공")

    def test_register_face_no_user_id(self):
        """사용자 ID 없이 얼굴 등록 시도 - 실패 테스트"""
        payload = {
            "image_base64": TEST_IMAGE_BASE64,
            "user_id": "",
            "user_name": TEST_USER_NAME
        }
        
        response = client.post("/face/register", json=payload)
        
        # 에러 응답 확인
        assert response.status_code in [400, 422]
        
        print(f"[성공] 사용자 ID 없음 검증 성공")

    def test_register_face_invalid_base64(self):
        """잘못된 Base64 이미지로 얼굴 등록 시도"""
        payload = {
            "image_base64": "invalid-base64-data",
            "user_id": TEST_USER_ID,
            "user_name": TEST_USER_NAME
        }
        
        response = client.post("/face/register", json=payload)
        
        # 응답 확인 (Base64 디코딩 에러 발생 가능)
        assert response.status_code in [400, 500]
        
        print(f"[성공] 잘못된 Base64 검증 성공")


class TestFaceRecognition:
    """얼굴 인식 API 테스트"""

    @pytest.fixture(autouse=True)
    def setup_teardown(self):
        """각 테스트 전후 설정"""
        # 테스트 전: 얼굴 등록
        payload = {
            "image_base64": TEST_IMAGE_BASE64,
            "user_id": "recognition_test@test.com",
            "user_name": "RecognitionTestUser"
        }
        client.post("/face/register", json=payload)
        
        yield
        
        # 테스트 후: 등록된 얼굴 데이터 삭제
        try:
            client.delete(f"/face/recognition_test@test.com")
        except:
            pass

    def test_recognize_face_success(self):
        """얼굴 인식 성공 테스트"""
        payload = {
            "image_base64": TEST_IMAGE_BASE64,
            "user_id": "recognition_test@test.com"
        }
        
        response = client.post("/face/recognize", json=payload)
        
        # 상태 코드 확인
        assert response.status_code == 200
        
        # 응답 데이터 확인
        data = response.json()
        assert "success" in data
        assert "face_detected" in data
        assert "face_count" in data
        
        print(f"[성공] 얼굴 인식 테스트 완료: {data}")

    def test_recognize_face_no_user_id(self):
        """사용자 ID 없이 전체 비교 얼굴 인식"""
        payload = {
            "image_base64": TEST_IMAGE_BASE64
        }
        
        response = client.post("/face/recognize", json=payload)
        
        # 상태 코드 확인
        assert response.status_code == 200
        
        # 응답 데이터 확인
        data = response.json()
        assert "success" in data
        assert "face_detected" in data
        
        print(f"[성공] 전체 비교 얼굴 인식 테스트 완료")

    def test_recognize_face_no_match(self):
        """매칭되지 않는 얼굴 인식 테스트"""
        payload = {
            "image_base64": TEST_IMAGE_BASE64,
            "user_id": "nonexistent_user@test.com"
        }
        
        response = client.post("/face/recognize", json=payload)
        
        # 상태 코드 확인
        assert response.status_code == 200
        
        # 응답 데이터 확인
        data = response.json()
        # 매칭 실패 시에도 success는 true일 수 있음 (API 호출 자체는 성공)
        assert "face_detected" in data
        
        print(f"[성공] 매칭 실패 테스트 완료")


class TestFaceDataManagement:
    """얼굴 데이터 관리 API 테스트"""

    def test_get_face_info_not_found(self):
        """존재하지 않는 사용자의 얼굴 정보 조회"""
        response = client.get(f"/face/nonexistent@test.com")
        
        # 404 Not Found 응답 확인
        assert response.status_code == 404
        
        print(f"[성공] 존재하지 않는 얼굴 정보 조회 테스트 완료")

    def test_delete_face_not_found(self):
        """존재하지 않는 사용자의 얼굴 데이터 삭제"""
        response = client.delete(f"/face/nonexistent@test.com")
        
        # 404 Not Found 응답 확인
        assert response.status_code == 404
        
        print(f"[성공] 존재하지 않는 얼굴 삭제 테스트 완료")

    def test_register_get_delete_flow(self):
        """얼굴 등록 -> 조회 -> 삭제 플로우 테스트"""
        test_user_id = "flow_test@test.com"
        
        # 1. 얼굴 등록
        register_payload = {
            "image_base64": TEST_IMAGE_BASE64,
            "user_id": test_user_id,
            "user_name": "FlowTestUser"
        }
        register_response = client.post("/face/register", json=register_payload)
        assert register_response.status_code == 200
        
        # 2. 얼굴 정보 조회
        get_response = client.get(f"/face/{test_user_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["user_id"] == test_user_id
        
        # 3. 얼굴 데이터 삭제
        delete_response = client.delete(f"/face/{test_user_id}")
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["success"] is True
        
        # 4. 삭제 후 조회 시 404 확인
        final_get_response = client.get(f"/face/{test_user_id}")
        assert final_get_response.status_code == 404
        
        print(f"[성공] 전체 플로우 테스트 완료")


class TestChatAPI:
    """AI 챗봇 API 테스트"""

    def test_chat_simple_message(self):
        """간단한 메시지 전송 테스트"""
        payload = {
            "message": "안녕하세요",
            "conversation_history": []
        }
        
        response = client.post("/chat", json=payload)
        
        # 상태 코드 확인
        assert response.status_code == 200
        
        # 응답 데이터 확인
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 0
        
        print(f"[성공] 챗봇 응답 테스트 완료")

    def test_chat_with_history(self):
        """대화 히스토리를 포함한 메시지 전송"""
        payload = {
            "message": "오늘 날씨는 어때?",
            "conversation_history": [
                {"role": "user", "content": "안녕하세요"},
                {"role": "assistant", "content": "안녕하세요! 무엇을 도와드릴까요?"}
            ]
        }
        
        response = client.post("/chat", json=payload)
        
        # 상태 코드 확인
        assert response.status_code == 200
        
        # 응답 데이터 확인
        data = response.json()
        assert "reply" in data
        
        print(f"[성공] 대화 히스토리 포함 테스트 완료")

    def test_chat_empty_message(self):
        """빈 메시지 전송 시 에러 처리"""
        payload = {
            "message": "",
            "conversation_history": []
        }
        
        response = client.post("/chat", json=payload)
        
        # 에러 응답 확인 (422 Validation Error 또는 400)
        assert response.status_code in [400, 422]
        
        print(f"[성공] 빈 메시지 검증 테스트 완료")


# pytest 실행 시 출력 설정
if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
