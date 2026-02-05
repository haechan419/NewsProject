package com.fullStc.exchange.repository;

import com.fullStc.exchange.domain.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

// 환율 정보 Repository
@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {
    // 조회 날짜로 환율 목록 조회
    List<ExchangeRate> findBySearchDate(LocalDate searchDate);

    // 통화 코드와 조회 날짜로 환율 조회
    Optional<ExchangeRate> findByCurUnitAndSearchDate(String curUnit, LocalDate searchDate);
}
