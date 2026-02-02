package com.fullStc.mainpage.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * 메인페이지용 경제 데이터 도메인
 */
@Entity
@Table(name = "main_page_economic_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MainPageEconomicData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 코스피 지수
     */
    @Column(name = "kospi", length = 50)
    private String kospi;

    /**
     * 코스피 변동
     */
    @Column(name = "kospi_change", length = 50)
    private String kospiChange;

    /**
     * 코스닥 지수
     */
    @Column(name = "kosdaq", length = 50)
    private String kosdaq;

    /**
     * 코스닥 변동
     */
    @Column(name = "kosdaq_change", length = 50)
    private String kosdaqChange;

    /**
     * 코스피200 지수
     */
    @Column(name = "kospi200", length = 50)
    private String kospi200;

    /**
     * 코스피200 변동
     */
    @Column(name = "kospi200_change", length = 50)
    private String kospi200Change;

    /**
     * 달러 환율
     */
    @Column(name = "dollar", length = 50)
    private String dollar;

    /**
     * 달러 변동
     */
    @Column(name = "dollar_change", length = 50)
    private String dollarChange;

    /**
     * 업데이트 일시
     */
    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
