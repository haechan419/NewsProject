package com.fullStc.drive.service;

import com.fullStc.drive.dto.NewsQueueResponse;

/**
 * 뉴스 큐 관련 서비스 인터페이스
 */
public interface QueueService {
    
    /**
     * 2+1 알고리즘: 개인화 뉴스 큐 생성
     */
    NewsQueueResponse generateNewsQueue(Long userId);
}
