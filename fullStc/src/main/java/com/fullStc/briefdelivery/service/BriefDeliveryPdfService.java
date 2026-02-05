package com.fullStc.briefdelivery.service;

import com.fullStc.briefdelivery.dto.BriefDeliveryPdfRequestDto;

/**
 * 브리핑 PDF 생성 서비스 인터페이스 (Python API 호출)
 */
public interface BriefDeliveryPdfService {

    /**
     * Python 서버에 PDF 생성 요청 후 PDF 바이트 반환
     */
    byte[] generatePdf(BriefDeliveryPdfRequestDto request);
}
