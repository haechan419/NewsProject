package com.fullStc.ai.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tbl_member_config")
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class MemberConfig extends BaseEntity {

    @Id
    private Long memberId; // 팀원 members.id와 연동

    @Column(length = 255)
    private String interestCategories; // 정치, 경제 등 6개 카테고리

    @Builder.Default
    private boolean isVip = false;

    @Builder.Default
    private boolean autoVideoEnabled = false;

    @Column(length = 10)
    private String scheduledTime; // "09:00" 등

    public void changeConfig(String interestCategories, boolean autoVideoEnabled, String scheduledTime) {
        this.interestCategories = interestCategories;
        this.autoVideoEnabled = autoVideoEnabled;
        this.scheduledTime = scheduledTime;
    }
}