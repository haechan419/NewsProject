package com.fullStc.drive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NewsQueueResponse {
    private List<NewsSummaryDto> personalNews; // 2개
    private NewsSummaryDto hotNews; // 1개
    private Integer totalCount;
}

