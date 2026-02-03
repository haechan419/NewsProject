package com.fullStc.support.service;

import com.fullStc.support.dto.QaHistoryResponse;
import com.fullStc.support.dto.QaMessageRequest;
import com.fullStc.support.dto.QaMessageResponse;

import java.util.List;

/**
 * Q&A 서비스 인터페이스
 */
public interface QaService {

    /**
     * Q&A 메시지 전송 및 AI 응답 받기
     * - FAQ DB를 참조하여 GPT-4o-mini가 답변 생성
     */
    QaMessageResponse sendMessage(Long userId, QaMessageRequest request);

    /**
     * Q&A 대화 히스토리 조회 (사용자별)
     */
    List<QaHistoryResponse> getHistory(Long userId);

    /**
     * Q&A 대화 히스토리 조회 (세션별)
     */
    List<QaHistoryResponse> getHistoryBySession(Long userId, String sessionId);
}
