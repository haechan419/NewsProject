package com.fullStc.exchange.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fullStc.exchange.client.ExchangeRateApiClient;
import com.fullStc.exchange.domain.ExchangeRate;
import com.fullStc.exchange.dto.ExchangeRateDTO;
import com.fullStc.exchange.dto.ExchangeRateResponseDTO;
import com.fullStc.exchange.dto.KoreaEximApiResponseDTO;
import com.fullStc.exchange.exception.ExchangeRateException;
import com.fullStc.exchange.repository.ExchangeRateRepository;
import com.fullStc.exchange.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * 환율 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeRateServiceImpl implements ExchangeRateService {

    private final ExchangeRateApiClient apiClient;
    private final ExchangeRateRepository repository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_KEY_PREFIX = "exchange-rate:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(10); // 10분 TTL
    
    // 일일 API 호출 횟수 추적 (1000회 제한)
    private final AtomicInteger dailyApiCallCount = new AtomicInteger(0);
    private LocalDate lastApiCallResetDate = LocalDate.now();
    private static final int MAX_DAILY_API_CALLS = 1000; // 일일 최대 API 호출 횟수
    private static final int WARNING_THRESHOLD = 800; // 경고 임계값

    @Override
    @Transactional(readOnly = true)
    public ExchangeRateResponseDTO getExchangeRates(LocalDate searchDate) {
        // effectively final을 위해 새로운 변수 사용
        final LocalDate finalSearchDate = (searchDate != null) ? searchDate : LocalDate.now();

        String dateStr = finalSearchDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String cacheKey = CACHE_KEY_PREFIX + dateStr;

        // Redis 캐시에서 조회
        try {
            String cachedData = redisTemplate.opsForValue().get(cacheKey);
            if (cachedData != null) {
                log.debug("캐시에서 환율 데이터 조회: {}", dateStr);
                return objectMapper.readValue(cachedData, ExchangeRateResponseDTO.class);
            }
        } catch (JsonProcessingException e) {
            log.warn("캐시 데이터 역직렬화 실패", e);
        } catch (org.springframework.data.redis.RedisConnectionFailureException e) {
            log.warn("Redis 연결 실패 - 캐시를 건너뛰고 DB에서 조회합니다: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("캐시 조회 중 오류 발생 - 캐시를 건너뛰고 DB에서 조회합니다: {}", e.getMessage());
        }

        // DB에서 조회
        List<ExchangeRate> dbRates = repository.findBySearchDate(finalSearchDate);
        if (!dbRates.isEmpty()) {
            log.debug("DB에서 환율 데이터 조회: {}", dateStr);
            List<ExchangeRateDTO> dtos = dbRates.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            ExchangeRateResponseDTO responseDTO = ExchangeRateResponseDTO.builder()
                    .exchangeRates(dtos)
                    .searchDate(dateStr)
                    .result(1)
                    .message("성공")
                    .build();
            // DB에서 가져온 데이터를 캐시에 저장
            try {
                redisTemplate.opsForValue().set(cacheKey, objectMapper.writeValueAsString(responseDTO), CACHE_TTL);
            } catch (JsonProcessingException e) {
                log.warn("DB 데이터 캐시 저장 실패 (직렬화 오류)", e);
            } catch (org.springframework.data.redis.RedisConnectionFailureException e) {
                log.debug("Redis 연결 실패 - 캐시 저장을 건너뜁니다: {}", e.getMessage());
            } catch (Exception e) {
                log.warn("DB 데이터 캐시 저장 실패", e);
            }
            return responseDTO;
        }

        // 캐시에도 DB에도 없으면 API 호출
        // 일일 API 호출 횟수 확인
        LocalDate today = LocalDate.now();
        if (!today.equals(lastApiCallResetDate)) {
            int previousCount = dailyApiCallCount.get();
            log.info("[환율 API 호출] 날짜 변경 감지 - 이전 날짜: {}, API 호출 횟수: {}", lastApiCallResetDate, previousCount);
            dailyApiCallCount.set(0);
            lastApiCallResetDate = today;
        }
        
        int currentApiCallCount = dailyApiCallCount.get();
        if (currentApiCallCount >= MAX_DAILY_API_CALLS) {
            log.warn("[환율 API 호출] 일일 API 호출 제한 도달 ({}회). 오늘은 더 이상 API를 호출하지 않습니다. DB 데이터를 반환합니다.", MAX_DAILY_API_CALLS);
            // DB에서 최신 데이터 반환 (없으면 빈 리스트)
            List<ExchangeRateDTO> dtos = dbRates.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ExchangeRateResponseDTO.builder()
                    .exchangeRates(dtos)
                    .searchDate(dateStr)
                    .result(1)
                    .message("일일 API 호출 제한 도달 - DB 데이터 반환")
                    .build();
        }
        
        if (currentApiCallCount >= WARNING_THRESHOLD) {
            log.warn("[환율 API 호출] 일일 API 호출 횟수 경고: {}/{} (임계값: {})", 
                    currentApiCallCount, MAX_DAILY_API_CALLS, WARNING_THRESHOLD);
        }
        
        log.info("API에서 환율 데이터 조회: {} (오늘 API 호출 횟수: {}/{})", dateStr, currentApiCallCount, MAX_DAILY_API_CALLS);
        List<KoreaEximApiResponseDTO> apiResponse = apiClient.fetchExchangeRates(dateStr);
        
        // API 호출 성공 시 카운터 증가
        int newCount = dailyApiCallCount.incrementAndGet();
        log.info("[환율 API 호출] API 호출 완료 - 오늘 API 호출 횟수: {}/{}", newCount, MAX_DAILY_API_CALLS);

        // DTO 변환 (이미 필터링된 데이터이므로 추가 필터링 불필요)
        List<ExchangeRateDTO> exchangeRates = apiResponse.stream()
                .filter(item -> {
                    // curUnit이 있는 경우만 변환
                    return item.getCurUnit() != null && !item.getCurUnit().trim().isEmpty();
                })
                .map(item -> convertToDTO(item, finalSearchDate))
                .filter(dto -> dto.getCurUnit() != null && !dto.getCurUnit().trim().isEmpty()) // 변환 후에도 검증
                .collect(Collectors.toList());

        // DB 저장 (별도 트랜잭션으로 실행)
        if (!exchangeRates.isEmpty()) {
            saveToDatabaseWithNewTransaction(exchangeRates, finalSearchDate);
        }

        // 응답 DTO 생성
        ExchangeRateResponseDTO response = ExchangeRateResponseDTO.builder()
                .exchangeRates(exchangeRates)
                .searchDate(dateStr)
                .result(1)
                .message("성공")
                .build();

        // Redis 캐시에 저장
        try {
            String json = objectMapper.writeValueAsString(response);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL);
            log.debug("환율 데이터 캐시 저장: {}", dateStr);
        } catch (JsonProcessingException e) {
            log.warn("캐시 데이터 직렬화 실패", e);
        } catch (org.springframework.data.redis.RedisConnectionFailureException e) {
            log.debug("Redis 연결 실패 - 캐시 저장을 건너뜁니다: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("캐시 저장 중 오류 발생", e);
        }

        return response;
    }

    @Override
    public ExchangeRateResponseDTO getAllExchangeRates() {
        return getExchangeRates(null);
    }

    @Override
    @Transactional(readOnly = true)
    public ExchangeRateDTO getExchangeRateByCurrency(String curUnit) {
        ExchangeRateResponseDTO response = getAllExchangeRates();
        return response.getExchangeRates().stream()
                .filter(rate -> curUnit.equalsIgnoreCase(rate.getCurUnit()))
                .findFirst()
                .orElseThrow(() -> new ExchangeRateException("해당 통화의 환율 정보를 찾을 수 없습니다: " + curUnit));
    }

    /**
     * API 응답 DTO를 ExchangeRateDTO로 변환
     */
    private ExchangeRateDTO convertToDTO(KoreaEximApiResponseDTO apiResponse, LocalDate searchDate) {
        return ExchangeRateDTO.builder()
                .curUnit(apiResponse.getCurUnit())
                .curNm(apiResponse.getCurNm())
                .dealBasR(parseBigDecimal(apiResponse.getDealBasR()))
                .ttb(parseBigDecimal(apiResponse.getTtb()))
                .tts(parseBigDecimal(apiResponse.getTts()))
                .bkpr(parseBigDecimal(apiResponse.getBkpr()))
                .searchDate(searchDate)
                .build();
    }

    /**
     * 엔티티를 ExchangeRateDTO로 변환
     */
    private ExchangeRateDTO convertToDTO(ExchangeRate entity) {
        return ExchangeRateDTO.builder()
                .curUnit(entity.getCurUnit())
                .curNm(entity.getCurNm())
                .dealBasR(entity.getDealBasR())
                .ttb(entity.getTtb())
                .tts(entity.getTts())
                .bkpr(entity.getBkpr())
                .searchDate(entity.getSearchDate())
                .build();
    }

    /**
     * 문자열을 BigDecimal로 변환 (쉼표 제거)
     */
    private BigDecimal parseBigDecimal(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            // 쉼표 제거 후 변환
            String cleaned = value.replace(",", "").trim();
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            log.warn("숫자 변환 실패: {}", value, e);
            return null;
        }
    }

    /**
     * DB에 환율 데이터 저장 (새로운 트랜잭션으로 실행)
     * Propagation.REQUIRES_NEW를 사용하여 readOnly 트랜잭션과 분리
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveToDatabaseWithNewTransaction(List<ExchangeRateDTO> exchangeRates, LocalDate searchDate) {
        log.info("DB에 환율 데이터 저장 시작 - 날짜: {}, 개수: {}", searchDate, exchangeRates.size());
        AtomicInteger savedCount = new AtomicInteger(0);
        AtomicInteger updatedCount = new AtomicInteger(0);

        for (ExchangeRateDTO dto : exchangeRates) {
            try {
                // 기존 데이터 확인
                repository.findByCurUnitAndSearchDate(dto.getCurUnit(), searchDate)
                        .ifPresentOrElse(
                                existing -> {
                                    // 업데이트
                                    ExchangeRate updated = ExchangeRate.builder()
                                            .id(existing.getId())
                                            .curUnit(dto.getCurUnit())
                                            .curNm(dto.getCurNm())
                                            .dealBasR(dto.getDealBasR())
                                            .ttb(dto.getTtb())
                                            .tts(dto.getTts())
                                            .bkpr(dto.getBkpr())
                                            .searchDate(searchDate)
                                            .result(1)
                                            .build();
                                    repository.save(updated);
                                    updatedCount.incrementAndGet();
                                    log.debug("환율 업데이트: {} - {}", dto.getCurUnit(), dto.getDealBasR());
                                },
                                () -> {
                                    // 신규 저장
                                    ExchangeRate newRate = ExchangeRate.builder()
                                            .curUnit(dto.getCurUnit())
                                            .curNm(dto.getCurNm())
                                            .dealBasR(dto.getDealBasR())
                                            .ttb(dto.getTtb())
                                            .tts(dto.getTts())
                                            .bkpr(dto.getBkpr())
                                            .searchDate(searchDate)
                                            .result(1)
                                            .build();
                                    repository.save(newRate);
                                    savedCount.incrementAndGet();
                                    log.debug("새 환율 저장: {} - {}", dto.getCurUnit(), dto.getDealBasR());
                                });
            } catch (Exception e) {
                log.error("환율 데이터 저장 실패 - 통화: {}, 날짜: {}", dto.getCurUnit(), searchDate, e);
            }
        }

        log.info("DB에 환율 데이터 저장 완료 - 날짜: {}, 신규: {}, 업데이트: {}", searchDate, savedCount.get(), updatedCount.get());
    }
}
