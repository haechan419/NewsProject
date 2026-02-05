package com.fullStc.mainpage.service;

import com.fullStc.mainpage.domain.MainPageEconomicData;
import com.fullStc.mainpage.dto.MainPageEconomicDataDTO;
import com.fullStc.mainpage.repository.MainPageEconomicDataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;

/**
 * 메인페이지 경제 데이터 서비스 (외부 API 연동, 10분 간격 업데이트)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MainPageEconomicDataService {

    private final RestTemplate restTemplate;
    private final MainPageEconomicDataRepository mainPageEconomicDataRepository;
    
    // 캐시된 경제 데이터
    private MainPageEconomicDataDTO cachedEconomicData;
    private Instant lastUpdated;

    /**
     * 경제 데이터 조회
     * 캐시된 데이터가 있으면 반환, 없으면 DB에서 조회
     */
    public MainPageEconomicDataDTO getEconomicData() {
        // 캐시가 있고 10분 이내에 업데이트된 경우 캐시 반환
        if (cachedEconomicData != null && lastUpdated != null) {
            long minutesSinceUpdate = (Instant.now().toEpochMilli() - lastUpdated.toEpochMilli()) / (1000 * 60);
            if (minutesSinceUpdate < 10) {
                return cachedEconomicData;
            }
        }

        // DB에서 최신 데이터 조회
        MainPageEconomicData latestData = mainPageEconomicDataRepository.findFirstByOrderByUpdatedAtDesc();
        if (latestData != null) {
            cachedEconomicData = convertToDTO(latestData);
            lastUpdated = latestData.getUpdatedAt();
            return cachedEconomicData;
        }

        // DB에도 없으면 API 호출
        return fetchEconomicData();
    }

    /**
     * 외부 API에서 경제 데이터 가져오기
     * 실제 API는 한국투자증권 API나 다른 무료 API를 사용할 수 있습니다.
     * 여기서는 예시로 더미 데이터를 반환합니다.
     */
    @Transactional
    public MainPageEconomicDataDTO fetchEconomicData() {
        try {
            log.info("경제 데이터 API 호출");
            
            // TODO: 실제 외부 API 연동
            // 예: 한국투자증권 API, Alpha Vantage, Yahoo Finance 등
            // 여기서는 예시 데이터를 반환합니다.
            
            // 더미 데이터 (실제로는 API 응답을 파싱)
            MainPageEconomicDataDTO data = MainPageEconomicDataDTO.builder()
                    .dollar("1,350.00")
                    .dollarChange("+5.00")
                    .updatedAt(Instant.now())
                    .build();

            // DB에 저장
            MainPageEconomicData entity = MainPageEconomicData.builder()
                    .dollar(data.getDollar())
                    .dollarChange(data.getDollarChange())
                    .updatedAt(data.getUpdatedAt())
                    .build();

            mainPageEconomicDataRepository.save(entity);

            // 캐시 업데이트
            cachedEconomicData = data;
            lastUpdated = Instant.now();

            return data;
        } catch (Exception e) {
            log.error("경제 데이터 조회 실패", e);
            // 실패 시 캐시된 데이터가 있으면 반환
            if (cachedEconomicData != null) {
                return cachedEconomicData;
            }
            // 캐시도 없으면 기본값 반환
            return MainPageEconomicDataDTO.builder()
                    .dollar("0")
                    .dollarChange("0")
                    .updatedAt(Instant.now())
                    .build();
        }
    }

    /**
     * 10분마다 경제 데이터 자동 업데이트
     */
    @Scheduled(fixedRate = 600000) // 10분 = 600,000ms
    @Transactional
    public void updateEconomicData() {
        log.info("경제 데이터 자동 업데이트 시작");
        try {
            fetchEconomicData();
            log.info("경제 데이터 자동 업데이트 완료");
        } catch (Exception e) {
            log.error("경제 데이터 자동 업데이트 실패", e);
        }
    }

    /**
     * MainPageEconomicData 엔티티를 DTO로 변환
     */
    private MainPageEconomicDataDTO convertToDTO(MainPageEconomicData entity) {
        return MainPageEconomicDataDTO.builder()
                .dollar(entity.getDollar())
                .dollarChange(entity.getDollarChange())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
