package com.fullStc.briefdelivery.service.impl;

import com.fullStc.briefdelivery.service.BriefDeliveryMailService;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;

/**
 * 브리핑 PDF 이메일 발송 서비스 구현 (Spring Mail + 네이버 SMTP)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BriefDeliveryMailServiceImpl implements BriefDeliveryMailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Override
    public void sendPdfMail(String toEmail, String userName, String subject, byte[] pdfBytes, String fileName) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("수신 이메일이 없습니다.");
        }
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException("PDF 데이터가 비어 있습니다.");
        }
        String from = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "noreply@newspulse.local";
        String safeFileName = (fileName != null && !fileName.isBlank()) ? fileName : "NewsPulse_Brief.pdf";

        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject(subject != null ? subject : "[NewsPulse] 뉴스펄스 맞춤 브리핑");
            helper.setText(
                    (userName != null && !userName.isBlank() ? userName + " " : "") + "님의 맞춤형 브리핑 PDF를 첨부했습니다.",
                    false
            );
            helper.addAttachment(safeFileName, new ByteArrayDataSource(pdfBytes, "application/pdf"));

            javaMailSender.send(message);
            log.info("브리핑 메일 발송 완료: to={}, fileName={}", toEmail, safeFileName);
        } catch (MessagingException e) {
            log.error("브리핑 메일 발송 실패: to={}, error={}", toEmail, e.getMessage());
            throw new RuntimeException("메일 발송에 실패했습니다: " + e.getMessage(), e);
        }
    }
}
