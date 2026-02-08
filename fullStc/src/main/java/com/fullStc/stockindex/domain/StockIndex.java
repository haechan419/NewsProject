package com.fullStc.stockindex.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 주가지수 정보 엔티티
 */
@Entity
@Table(name = "stock_index")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockIndex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 기준일
    @Column(name = "bas_dt", nullable = false)
    private LocalDate basDt;

    // 지수명 (코스피, 코스닥)
    @Column(name = "idx_nm", nullable = false, length = 50)
    private String idxNm;

    // 종가
    @Column(name = "clpr", precision = 20, scale = 2)
    private BigDecimal clpr;

    // 전일 대비
    @Column(name = "vs", precision = 20, scale = 2)
    private BigDecimal vs;

    // 등락률 (%)
    @Column(name = "flt_rt", precision = 10, scale = 4)
    private BigDecimal fltRt;

    // 시장 구분 (KOSPI, KOSDAQ)
    @Column(name = "mrkt_cls", nullable = false, length = 10)
    private String mrktCls;
}
