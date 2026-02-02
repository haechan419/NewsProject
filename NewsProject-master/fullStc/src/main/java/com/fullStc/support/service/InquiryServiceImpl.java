package com.fullStc.support.service;

import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;
import com.fullStc.support.domain.InquiryTicket;
import com.fullStc.support.dto.InquiryAdminRequest;
import com.fullStc.support.dto.InquiryCreateRequest;
import com.fullStc.support.dto.InquiryResponse;
import com.fullStc.support.repository.InquiryTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 문의 티켓 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InquiryServiceImpl implements InquiryService {

    private final InquiryTicketRepository inquiryTicketRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public InquiryResponse createInquiry(Long userId, InquiryCreateRequest request) {
        log.info("문의 티켓 생성 - userId: {}, title: {}", userId, request.getTitle());

        Member user = memberRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        InquiryTicket ticket = InquiryTicket.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .build();

        InquiryTicket savedTicket = inquiryTicketRepository.save(ticket);
        log.info("문의 티켓 생성 완료 - id: {}", savedTicket.getId());

        return InquiryResponse.from(savedTicket);
    }

    @Override
    public List<InquiryResponse> getMyInquiries(Long userId) {
        log.info("내 문의 목록 조회 - userId: {}", userId);
        return inquiryTicketRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(InquiryResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public InquiryResponse getInquiryById(Long userId, Long inquiryId) {
        log.info("문의 상세 조회 - userId: {}, inquiryId: {}", userId, inquiryId);

        InquiryTicket ticket = inquiryTicketRepository.findById(inquiryId)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다. ID: " + inquiryId));

        // 본인 문의만 조회 가능
        if (!ticket.getUser().getId().equals(userId)) {
            throw new RuntimeException("해당 문의에 대한 접근 권한이 없습니다.");
        }

        return InquiryResponse.from(ticket);
    }

    // ===== 관리자 기능 =====

    @Override
    public List<InquiryResponse> getAllInquiries() {
        log.info("전체 문의 목록 조회 (관리자)");
        return inquiryTicketRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(InquiryResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public InquiryResponse getInquiryByIdForAdmin(Long inquiryId) {
        log.info("문의 상세 조회 (관리자) - inquiryId: {}", inquiryId);

        InquiryTicket ticket = inquiryTicketRepository.findById(inquiryId)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다. ID: " + inquiryId));

        return InquiryResponse.from(ticket);
    }

    @Override
    @Transactional
    public InquiryResponse updateInquiry(Long inquiryId, InquiryAdminRequest request) {
        log.info("문의 상태/답변 업데이트 - inquiryId: {}", inquiryId);

        InquiryTicket ticket = inquiryTicketRepository.findById(inquiryId)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다. ID: " + inquiryId));

        // 상태 변경
        if (request.getStatus() != null) {
            ticket.changeStatus(request.getStatus());
        }

        // 관리자 답변 작성
        if (request.getAdminResponse() != null && !request.getAdminResponse().isEmpty()) {
            ticket.setAdminResponse(request.getAdminResponse());
        }

        log.info("문의 업데이트 완료 - inquiryId: {}, status: {}", inquiryId, ticket.getStatus());

        return InquiryResponse.from(ticket);
    }
}
