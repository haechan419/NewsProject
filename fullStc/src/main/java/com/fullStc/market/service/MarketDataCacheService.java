package com.fullStc.market.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fullStc.market.dto.MarketDataDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis를 사용한 금융 데이터 캐시 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarketDataCacheService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_KEY_PREFIX = "market:data:";
    private static final String CACHE_KEY_ALL = CACHE_KEY_PREFIX + "all";
    private static final Duration CACHE_TTL = Duration.ofMinutes(5); // 5분 TTL (변동액 계산을 위해 충분한 시간 확보)

    /**
     * 전체 시장 데이터를 Redis에 저장
     */
    public void saveMarketData(MarketDataDTO data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(CACHE_KEY_ALL, json, CACHE_TTL);
            log.debug("시장 데이터 캐시 저장 완료: {}", CACHE_KEY_ALL);
        } catch (JsonProcessingException e) {
            log.error("시장 데이터 직렬화 실패", e);
        } catch (Exception e) {
            log.warn("Redis 캐시 저장 실패 (계속 진행): {}", e.getMessage());
        }
    }

    /**
     * 전체 시장 데이터를 Redis에서 조회
     */
    public MarketDataDTO getMarketData() {
        try {
            String json = redisTemplate.opsForValue().get(CACHE_KEY_ALL);
            if (json != null) {
                return objectMapper.readValue(json, MarketDataDTO.class);
            }
        } catch (JsonProcessingException e) {
            log.error("시장 데이터 역직렬화 실패", e);
        } catch (Exception e) {
            log.warn("Redis 캐시 조회 실패 (계속 진행): {}", e.getMessage());
        }
        return null;
    }

    /**
     * 특정 키의 데이터 저장 (예: 환율, 지수 등)
     */
    public void saveData(String key, Object data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(CACHE_KEY_PREFIX + key, json, CACHE_TTL);
        } catch (JsonProcessingException e) {
            log.error("데이터 직렬화 실패: {}", key, e);
        } catch (Exception e) {
            log.warn("Redis 캐시 저장 실패 (계속 진행): key={}, error={}", key, e.getMessage());
        }
    }

    /**
     * 특정 키의 데이터 조회
     */
    public <T> T getData(String key, Class<T> clazz) {
        try {
            String json = redisTemplate.opsForValue().get(CACHE_KEY_PREFIX + key);
            if (json != null) {
                return objectMapper.readValue(json, clazz);
            }
        } catch (JsonProcessingException e) {
            log.error("데이터 역직렬화 실패: {}", key, e);
        } catch (Exception e) {
            log.warn("Redis 캐시 조회 실패 (계속 진행): key={}, error={}", key, e.getMessage());
        }
        return null;
    }

    /**
     * 캐시 삭제
     */
    public void deleteCache(String key) {
        redisTemplate.delete(CACHE_KEY_PREFIX + key);
    }

    /**
     * 전체 캐시 삭제
     */
    public void deleteAllCache() {
        redisTemplate.delete(CACHE_KEY_ALL);
    }
}
