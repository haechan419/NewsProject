package com.fullStc.exchange.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

// 환율 정보 엔티티
@Entity
@Table(name = "exchange_rate")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 통화 코드
    @Column(name = "cur_unit", nullable = false, length = 10)
    private String curUnit;

    // 국가/통화명
    @Column(name = "cur_nm", length = 100)
    private String curNm;

    // 매매 기준율
    @Column(name = "deal_bas_r", precision = 20, scale = 4)
    private BigDecimal dealBasR;

    // 송금 받을 때
    @Column(name = "ttb", precision = 20, scale = 4)
    private BigDecimal ttb;

    // 송금 보낼 때
    @Column(name = "tts", precision = 20, scale = 4)
    private BigDecimal tts;

    // 장부가격
    @Column(name = "bkpr", precision = 20, scale = 4)
    private BigDecimal bkpr;

    // 조회 날짜
    @Column(name = "search_date", nullable = false)
    private LocalDate searchDate;

    // 결과 코드 (1: 성공)
    @Column(name = "result")
    private Integer result;
}
