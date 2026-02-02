package com.fullStc.mainpage.repository;

import com.fullStc.mainpage.domain.MainPageEconomicData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 메인페이지 경제 데이터 Repository
 */
@Repository
public interface MainPageEconomicDataRepository extends JpaRepository<MainPageEconomicData, Long> {

    /**
     * 가장 최근 경제 데이터 조회
     */
    MainPageEconomicData findFirstByOrderByUpdatedAtDesc();
}
