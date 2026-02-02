package com.fullStc.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.HttpEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.fullStc.ai.dto.FaceRecognitionRequestDTO;
import com.fullStc.ai.dto.FaceRecognitionResponseDTO;
import com.fullStc.ai.dto.FaceRegisterRequestDTO;
import com.fullStc.ai.dto.FaceRegisterResponseDTO;
import com.fullStc.ai.dto.PythonFaceRecognitionResponseDTO;
import com.fullStc.ai.dto.PythonFaceRegisterResponseDTO;
import com.fullStc.ai.repository.FaceRepository;
import com.fullStc.member.domain.Member;
import com.fullStc.member.domain.enums.MemberRole;
import com.fullStc.member.repository.MemberRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * AI 얼굴 인식 서비스 테스트
 */
@Slf4j
@SpringBootTest
@Transactional
class AiFaceServiceTests {

    @Autowired
    private AiFaceService aiFaceService;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private FaceRepository faceRepository;

    @MockitoBean
    private RestTemplate restTemplate;

    private Member testMember;
    private String testImageBase64;

    @BeforeEach
    void setUp() {
        // 테스트용 회원 생성
        testMember = Member.builder()
                .email("facetest@test.com")
                .password("encodedPassword")
                .nickname("FaceTestUser")
                .provider("local")
                .enabled(true)
                .build();
        testMember.addRole(MemberRole.USER);
        testMember = memberRepository.save(testMember);

        // 테스트용 Base64 이미지 (1x1 픽셀 투명 PNG)
        testImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    @Test
    @DisplayName("얼굴 등록 성공 - DB 저장")
    void testRegisterFace_Success() {
        // given
        FaceRegisterRequestDTO requestDTO = FaceRegisterRequestDTO.builder()
                .imageBase64(testImageBase64)
                .userId(testMember.getEmail())
                .userName(testMember.getNickname())
                .build();

        // Python 서버 응답 Mock 설정
        PythonFaceRegisterResponseDTO pythonResponse = PythonFaceRegisterResponseDTO.builder()
                .success(true)
                .message("얼굴 등록 성공")
                .faceDetected(true)
                .faceDescription("정면을 보고 있는 얼굴")
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(PythonFaceRegisterResponseDTO.class)))
                .thenReturn(pythonResponse);

        // when
        FaceRegisterResponseDTO response = aiFaceService.registerFace(requestDTO);

        // then
        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isFaceDetected()).isTrue();
        assertThat(response.getMessage()).contains("등록이 완료되었습니다");

        // DB 저장 확인
        var savedFaces = faceRepository.findByMemberEmailOrderByCreatedAtDesc(testMember.getEmail());
        assertThat(savedFaces).hasSize(1);
        assertThat(savedFaces.get(0).getMember().getEmail()).isEqualTo(testMember.getEmail());

        log.info("✅ 얼굴 등록 테스트 성공");
    }

    @Test
    @DisplayName("얼굴 등록 실패 - 이미지 데이터 없음")
    void testRegisterFace_NoImage() {
        // given
        FaceRegisterRequestDTO requestDTO = FaceRegisterRequestDTO.builder()
                .imageBase64(null)
                .userId(testMember.getEmail())
                .userName(testMember.getNickname())
                .build();

        // when & then
        assertThatThrownBy(() -> aiFaceService.registerFace(requestDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("이미지 데이터가 필요합니다");

        log.info("✅ 이미지 데이터 없음 검증 성공");
    }

    @Test
    @DisplayName("얼굴 등록 실패 - 사용자 ID 없음")
    void testRegisterFace_NoUserId() {
        // given
        FaceRegisterRequestDTO requestDTO = FaceRegisterRequestDTO.builder()
                .imageBase64(testImageBase64)
                .userId(null)
                .userName(testMember.getNickname())
                .build();

        // when & then
        assertThatThrownBy(() -> aiFaceService.registerFace(requestDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("사용자 ID가 필요합니다");

        log.info("✅ 사용자 ID 없음 검증 성공");
    }

    @Test
    @DisplayName("얼굴 등록 실패 - 존재하지 않는 회원")
    void testRegisterFace_MemberNotFound() {
        // given
        FaceRegisterRequestDTO requestDTO = FaceRegisterRequestDTO.builder()
                .imageBase64(testImageBase64)
                .userId("nonexistent@test.com")
                .userName("NonExistent")
                .build();

        // when & then
        assertThatThrownBy(() -> aiFaceService.registerFace(requestDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("회원을 찾을 수 없습니다");

        log.info("✅ 존재하지 않는 회원 검증 성공");
    }

    @Test
    @DisplayName("얼굴 등록 실패 - 이미지 크기 초과 (10MB)")
    void testRegisterFace_ImageTooLarge() {
        // given - 10MB 초과 Base64 문자열 생성
        String largeImage = "a".repeat(11 * 1024 * 1024); // 11MB
        FaceRegisterRequestDTO requestDTO = FaceRegisterRequestDTO.builder()
                .imageBase64(largeImage)
                .userId(testMember.getEmail())
                .userName(testMember.getNickname())
                .build();

        // when & then
        assertThatThrownBy(() -> aiFaceService.registerFace(requestDTO))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("10MB 이하여야 합니다");

        log.info("✅ 이미지 크기 초과 검증 성공");
    }

    @Test
    @DisplayName("얼굴 인식 성공 - 특정 사용자와 비교")
    void testRecognizeFace_Success_SpecificUser() {
        // given - 먼저 얼굴 등록
        FaceRegisterRequestDTO registerDTO = FaceRegisterRequestDTO.builder()
                .imageBase64(testImageBase64)
                .userId(testMember.getEmail())
                .userName(testMember.getNickname())
                .build();

        PythonFaceRegisterResponseDTO registerResponse = PythonFaceRegisterResponseDTO.builder()
                .success(true)
                .message("얼굴 등록 성공")
                .faceDetected(true)
                .faceDescription("정면을 보고 있는 얼굴")
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(PythonFaceRegisterResponseDTO.class)))
                .thenReturn(registerResponse);

        aiFaceService.registerFace(registerDTO);

        // 얼굴 인식 요청
        FaceRecognitionRequestDTO recognitionDTO = FaceRecognitionRequestDTO.builder()
                .imageBase64(testImageBase64)
                .userId(testMember.getEmail())
                .build();

        // Python 서버 응답 Mock 설정
        PythonFaceRecognitionResponseDTO pythonResponse = PythonFaceRecognitionResponseDTO.builder()
                .success(true)
                .faceDetected(true)
                .faceCount(1)
                .description("얼굴 매칭 성공")
                .matchedUserId(testMember.getEmail())
                .matchedUserName(testMember.getNickname())
                .confidence(0.95)
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(PythonFaceRecognitionResponseDTO.class)))
                .thenReturn(pythonResponse);

        // when
        FaceRecognitionResponseDTO response = aiFaceService.recognizeFace(recognitionDTO);

        // then
        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isFaceDetected()).isTrue();
        assertThat(response.getMatchedUserId()).isEqualTo(testMember.getEmail());
        assertThat(response.getConfidence()).isGreaterThan(0.9);

        log.info("✅ 얼굴 인식 테스트 성공 - 신뢰도: {}", response.getConfidence());
    }

    @Test
    @DisplayName("얼굴 인식 실패 - 등록된 얼굴 없음")
    void testRecognizeFace_NoRegisteredFace() {
        // given
        FaceRecognitionRequestDTO recognitionDTO = FaceRecognitionRequestDTO.builder()
                .imageBase64(testImageBase64)
                .userId(testMember.getEmail())
                .build();

        // when
        FaceRecognitionResponseDTO response = aiFaceService.recognizeFace(recognitionDTO);

        // then
        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getError()).contains("등록된 얼굴 데이터가 없습니다");

        log.info("✅ 등록된 얼굴 없음 검증 성공");
    }

    @Test
    @DisplayName("얼굴 데이터 삭제 성공")
    void testDeleteFaceData_Success() {
        // given - 먼저 얼굴 등록
        FaceRegisterRequestDTO registerDTO = FaceRegisterRequestDTO.builder()
                .imageBase64(testImageBase64)
                .userId(testMember.getEmail())
                .userName(testMember.getNickname())
                .build();

        PythonFaceRegisterResponseDTO registerResponse = PythonFaceRegisterResponseDTO.builder()
                .success(true)
                .message("얼굴 등록 성공")
                .faceDetected(true)
                .faceDescription("정면을 보고 있는 얼굴")
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(PythonFaceRegisterResponseDTO.class)))
                .thenReturn(registerResponse);

        aiFaceService.registerFace(registerDTO);

        // DB에 저장되었는지 확인
        var facesBeforeDelete = faceRepository.findByMemberEmailOrderByCreatedAtDesc(testMember.getEmail());
        assertThat(facesBeforeDelete).isNotEmpty();

        // when
        aiFaceService.deleteFaceData(testMember.getEmail());

        // then
        var facesAfterDelete = faceRepository.findByMemberEmailOrderByCreatedAtDesc(testMember.getEmail());
        assertThat(facesAfterDelete).isEmpty();

        log.info("✅ 얼굴 데이터 삭제 테스트 성공");
    }

    @Test
    @DisplayName("Base64 헤더 제거 처리 확인")
    void testRegisterFace_Base64HeaderRemoval() {
        // given - data:image/png;base64, 헤더가 포함된 이미지
        String imageWithHeader = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        FaceRegisterRequestDTO requestDTO = FaceRegisterRequestDTO.builder()
                .imageBase64(imageWithHeader)
                .userId(testMember.getEmail())
                .userName(testMember.getNickname())
                .build();

        PythonFaceRegisterResponseDTO pythonResponse = PythonFaceRegisterResponseDTO.builder()
                .success(true)
                .message("얼굴 등록 성공")
                .faceDetected(true)
                .faceDescription("정면을 보고 있는 얼굴")
                .build();

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(PythonFaceRegisterResponseDTO.class)))
                .thenReturn(pythonResponse);

        // when
        FaceRegisterResponseDTO response = aiFaceService.registerFace(requestDTO);

        // then
        assertThat(response).isNotNull();
        assertThat(response.isSuccess()).isTrue();

        log.info("✅ Base64 헤더 제거 처리 테스트 성공");
    }
}
