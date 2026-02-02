package com.fullStc.ai.service;

import com.fullStc.ai.domain.Face;
import com.fullStc.ai.dto.FaceRegisterRequestDTO;
import com.fullStc.ai.dto.FaceRegisterResponseDTO;
import com.fullStc.ai.dto.FaceRecognitionRequestDTO;
import com.fullStc.ai.dto.FaceRecognitionResponseDTO;
import com.fullStc.ai.dto.PythonFaceRegisterRequestDTO;
import com.fullStc.ai.dto.PythonFaceRegisterResponseDTO;
import com.fullStc.ai.dto.PythonFaceRecognitionRequestDTO;
import com.fullStc.ai.dto.PythonFaceRecognitionResponseDTO;
import com.fullStc.ai.repository.FaceRepository;
import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * AI 얼굴 인식 서비스 구현체
 * Python FastAPI 서버와 통신
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AiFaceServiceImpl implements AiFaceService {

    private final RestTemplate restTemplate;
    private final FaceRepository faceRepository;
    private final MemberRepository memberRepository;

    /** Python FastAPI 서버 URL */
    @Value("${ai.python.server.url:http://localhost:8000}")
    private String pythonServerUrl;

    @Override
    public FaceRegisterResponseDTO registerFace(FaceRegisterRequestDTO requestDTO) {
        log.info("얼굴 등록 요청 (AI 분석 없이): user_id={}", requestDTO.getUserId());

        // 데이터 검증
        if (requestDTO.getImageBase64() == null || requestDTO.getImageBase64().isEmpty()) {
            log.error("이미지 데이터가 없습니다.");
            throw new RuntimeException("이미지 데이터가 필요합니다.");
        }

        if (requestDTO.getUserId() == null || requestDTO.getUserId().isEmpty()) {
            log.error("사용자 ID가 없습니다.");
            throw new RuntimeException("사용자 ID가 필요합니다.");
        }

        // Base64 데이터에서 헤더 제거 (data:image/... 형식인 경우)
        String imageBase64 = requestDTO.getImageBase64();
        if (imageBase64.contains(",")) {
            imageBase64 = imageBase64.split(",")[1];
        }

        // 이미지 크기 검증 (10MB 제한)
        int imageSize = imageBase64.length();
        int maxSize = 10 * 1024 * 1024; // 10MB
        if (imageSize > maxSize) {
            log.error("이미지 크기가 너무 큽니다: {} bytes", imageSize);
            throw new RuntimeException("이미지 크기는 10MB 이하여야 합니다.");
        }

        log.debug("이미지 데이터 길이: {} bytes ({} KB)", imageSize, imageSize / 1024);

        try {
            // 회원 조회 (userId는 email로 사용)
            Member member = memberRepository.findByEmail(requestDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("회원을 찾을 수 없습니다: " + requestDTO.getUserId()));

            // 얼굴 데이터 DB에 저장 (AI 분석 없이)
            Face face = Face.builder()
                    .member(member)
                    .imageBase64(requestDTO.getImageBase64()) // 원본 Base64 데이터 저장
                    .faceDescription("") // 등록 시에는 설명 없음
                    .faceDetected(true) // 등록 시에는 항상 true로 설정
                    .faceCount(1) // 등록 시에는 1명
                    .quality("good") // 기본값
                    .build();

            faceRepository.save(face);
            log.info("얼굴 데이터 DB 저장 완료 (AI 분석 없이): member_id={}, face_id={}", member.getId(), face.getId());

            // Python 서버에도 얼굴 데이터 저장 (파일 시스템에 저장하여 얼굴 인식 시 사용)
            try {
                PythonFaceRegisterRequestDTO pythonRequest = PythonFaceRegisterRequestDTO.builder()
                        .imageBase64(imageBase64)
                        .userId(member.getEmail())
                        .userName(member.getNickname())
                        .build();

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<PythonFaceRegisterRequestDTO> httpEntity = new HttpEntity<>(pythonRequest, headers);

                String url = pythonServerUrl + "/face/register";
                log.debug("Python 서버 얼굴 등록 요청 URL: {}", url);

                PythonFaceRegisterResponseDTO pythonResponse = restTemplate.postForObject(
                        url,
                        httpEntity,
                        PythonFaceRegisterResponseDTO.class);

                if (pythonResponse != null && pythonResponse.isSuccess()) {
                    log.info("Python 서버 얼굴 등록 완료: user_id={}, face_description={}",
                            member.getEmail(), pythonResponse.getFaceDescription());

                    // Python 서버에서 생성한 얼굴 설명을 DB에 업데이트
                    if (pythonResponse.getFaceDescription() != null && !pythonResponse.getFaceDescription().isEmpty()) {
                        face.updateFaceDescription(pythonResponse.getFaceDescription());
                        faceRepository.save(face);
                    }
                } else {
                    log.warn("Python 서버 얼굴 등록 실패: user_id={}", member.getEmail());
                }
            } catch (Exception e) {
                log.error("Python 서버 얼굴 등록 중 오류 발생: {}", e.getMessage(), e);
                // Python 서버 등록 실패해도 DB 저장은 성공한 것으로 처리
            }

            // 성공 응답 반환
            return FaceRegisterResponseDTO.builder()
                    .success(true)
                    .message("얼굴 등록이 완료되었습니다.")
                    .faceDetected(true)
                    .faceDescription(face.getFaceDescription())
                    .error(null)
                    .build();

        } catch (Exception e) {
            log.error("얼굴 등록 처리 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("얼굴 등록 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

    @Override
    public FaceRecognitionResponseDTO recognizeFace(FaceRecognitionRequestDTO requestDTO) {
        log.info("얼굴 인식 요청 수신");

        try {
            // 특정 사용자와 비교하는 경우
            if (requestDTO.getUserId() != null && !requestDTO.getUserId().isEmpty()) {
                // DB에서 해당 사용자의 얼굴 데이터 조회
                Optional<Face> faceOpt = faceRepository
                        .findFirstByMemberEmailOrderByCreatedAtDesc(requestDTO.getUserId());

                if (faceOpt.isPresent()) {
                    // Python 서버로 전송할 요청 생성
                    PythonFaceRecognitionRequestDTO pythonRequest = PythonFaceRecognitionRequestDTO.builder()
                            .imageBase64(requestDTO.getImageBase64())
                            .userId(requestDTO.getUserId())
                            .build();

                    // HTTP 헤더 설정
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.APPLICATION_JSON);

                    // HTTP 요청 생성
                    HttpEntity<PythonFaceRecognitionRequestDTO> httpEntity = new HttpEntity<>(pythonRequest, headers);

                    // Python 서버에 POST 요청
                    String url = pythonServerUrl + "/face/recognize";
                    log.debug("Python 서버 요청 URL: {}", url);

                    PythonFaceRecognitionResponseDTO pythonResponse = restTemplate.postForObject(
                            url,
                            httpEntity,
                            PythonFaceRecognitionResponseDTO.class);

                    if (pythonResponse == null) {
                        log.error("Python 서버로부터 빈 응답 수신");
                        throw new RuntimeException("얼굴 인식 응답을 받지 못했습니다.");
                    }

                    log.info("얼굴 인식 응답 수신 완료");

                    // Python 응답을 DTO로 변환
                    return FaceRecognitionResponseDTO.builder()
                            .success(pythonResponse.isSuccess())
                            .faceDetected(pythonResponse.isFaceDetected())
                            .faceCount(pythonResponse.getFaceCount())
                            .description(pythonResponse.getDescription())
                            .matchedUserId(pythonResponse.getMatchedUserId())
                            .matchedUserName(pythonResponse.getMatchedUserName())
                            .confidence(pythonResponse.getConfidence())
                            .error(pythonResponse.getError())
                            .build();
                } else {
                    log.warn("등록된 얼굴 데이터가 없습니다: userId={}", requestDTO.getUserId());
                    return FaceRecognitionResponseDTO.builder()
                            .success(false)
                            .faceDetected(false)
                            .faceCount(0)
                            .description("")
                            .matchedUserId(null)
                            .matchedUserName(null)
                            .confidence(0.0)
                            .error("등록된 얼굴 데이터가 없습니다.")
                            .build();
                }
            }

            // 등록된 모든 얼굴과 비교하는 경우
            // Python 서버의 find_matching_user 함수 사용 (파일 시스템에서 모든 얼굴 데이터 검색)
            PythonFaceRecognitionRequestDTO pythonRequest = PythonFaceRecognitionRequestDTO.builder()
                    .imageBase64(requestDTO.getImageBase64())
                    .userId(null) // 전체 비교를 위해 null
                    .build();

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // HTTP 요청 생성
            HttpEntity<PythonFaceRecognitionRequestDTO> httpEntity = new HttpEntity<>(pythonRequest, headers);

            // Python 서버에 POST 요청
            String url = pythonServerUrl + "/face/recognize";
            log.debug("Python 서버 요청 URL: {}", url);

            PythonFaceRecognitionResponseDTO pythonResponse = restTemplate.postForObject(
                    url,
                    httpEntity,
                    PythonFaceRecognitionResponseDTO.class);

            if (pythonResponse == null) {
                log.error("Python 서버로부터 빈 응답 수신");
                throw new RuntimeException("얼굴 인식 응답을 받지 못했습니다.");
            }

            log.info("얼굴 인식 응답 수신 완료: matched_user_id={}, confidence={}",
                    pythonResponse.getMatchedUserId(), pythonResponse.getConfidence());

            // Python 응답을 DTO로 변환
            return FaceRecognitionResponseDTO.builder()
                    .success(pythonResponse.isSuccess())
                    .faceDetected(pythonResponse.isFaceDetected())
                    .faceCount(pythonResponse.getFaceCount())
                    .description(pythonResponse.getDescription())
                    .matchedUserId(pythonResponse.getMatchedUserId())
                    .matchedUserName(pythonResponse.getMatchedUserName())
                    .confidence(pythonResponse.getConfidence())
                    .error(pythonResponse.getError())
                    .build();

        } catch (RestClientException e) {
            log.error("Python 서버 통신 에러: {}", e.getMessage());
            throw new RuntimeException("얼굴 인식 처리 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public void deleteFaceData(String userId) {
        log.info("얼굴 데이터 삭제 요청: userId={}", userId);

        try {
            // 1. DB에서 얼굴 데이터 삭제
            Member member = memberRepository.findByEmail(userId)
                    .orElse(null);

            if (member != null) {
                faceRepository.deleteByMemberId(member.getId());
                log.info("DB에서 얼굴 데이터 삭제 완료: userId={}, memberId={}", userId, member.getId());
            }

            // 2. Python 서버에 얼굴 데이터 삭제 요청
            try {
                String url = pythonServerUrl + "/face/" + userId;
                log.debug("Python 서버 얼굴 삭제 요청 URL: {}", url);

                restTemplate.delete(url);
                log.info("Python 서버에서 얼굴 데이터 삭제 완료: userId={}", userId);

            } catch (Exception e) {
                log.error("Python 서버 얼굴 데이터 삭제 중 오류 발생 (무시하고 계속): {}", e.getMessage());
                // Python 서버 삭제 실패해도 계속 진행
            }

        } catch (Exception e) {
            log.error("얼굴 데이터 삭제 중 오류 발생: {}", e.getMessage(), e);
            // 오류가 발생해도 회원 탈퇴는 계속 진행되어야 하므로 예외를 throw하지 않음
        }
    }
}
