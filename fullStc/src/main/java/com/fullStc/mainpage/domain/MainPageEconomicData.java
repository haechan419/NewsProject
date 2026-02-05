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
