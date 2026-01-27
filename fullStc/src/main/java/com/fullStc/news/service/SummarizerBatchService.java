package com.fullStc.news.service;

import org.springframework.stereotype.Service;

@Service
public class SummarizerBatchService {

    /**
     * 지금은 enrich에서 ai_summary를 만든다고 했으니
     * 일단 0 리턴만 해도 파이프라인은 정상 동작
     */
    public int fillAiSummaries(int limit) {
        return 0;
    }
}
