package com.fullStc.briefdelivery.service;

/**
 * 브리핑 PDF 이메일 발송 서비스 인터페이스
 */
public interface BriefDeliveryMailService {

    /**
     * PDF를 첨부하여 수신자 이메일로 발송
     */
    void sendPdfMail(String toEmail, String userName, String subject, byte[] pdfBytes, String fileName);
}
