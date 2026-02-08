package com.fullStc.stockindex.repository;

import com.fullStc.stockindex.domain.StockIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 주가지수 정보 Repository
 */
@Repository
public interface StockIndexRepository extends JpaRepository<StockIndex, Long> {
    // 기준일로 주가지수 목록 조회
    List<StockIndex> findByBasDt(LocalDate basDt);

    // 시장 구분과 기준일로 주가지수 조회
    Optional<StockIndex> findByMrktClsAndBasDt(String mrktCls, LocalDate basDt);

    // 시장 구분으로 최신 주가지수 조회
    Optional<StockIndex> findFirstByMrktClsOrderByBasDtDesc(String mrktCls);
}
