package com.fullStc.support.service;

import com.fullStc.support.domain.Faq;
import com.fullStc.support.domain.FaqCategory;
import com.fullStc.support.dto.FaqRequest;
import com.fullStc.support.dto.FaqResponse;
import com.fullStc.support.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * FAQ 서비스 구현체
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaqServiceImpl implements FaqService {

    private final FaqRepository faqRepository;

    @Override
    public List<FaqResponse> getAllFaqs() {
        log.info("전체 FAQ 목록 조회");
        return faqRepository.findAllByOrderByViewCountDesc()
                .stream()
                .map(FaqResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<FaqResponse> getFaqsByCategory(FaqCategory category) {
        log.info("카테고리별 FAQ 목록 조회: {}", category);
        return faqRepository.findByCategoryOrderByViewCountDesc(category)
                .stream()
                .map(FaqResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public FaqResponse getFaqById(Long id) {
        log.info("FAQ 상세 조회: {}", id);
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ를 찾을 수 없습니다. ID: " + id));
        return FaqResponse.from(faq);
    }

    @Override
    public List<FaqResponse> searchFaqs(String keyword, FaqCategory category) {
        log.info("FAQ 검색 - 키워드: {}, 카테고리: {}", keyword, category);
        
        List<Faq> faqs;
        if (category != null) {
            faqs = faqRepository.searchByCategoryAndKeyword(category, keyword);
        } else {
            faqs = faqRepository.searchByKeyword(keyword);
        }
        
        return faqs.stream()
                .map(FaqResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FaqResponse clickFaq(Long id) {
        log.info("FAQ 버튼 클릭: {}", id);
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ를 찾을 수 없습니다. ID: " + id));
        faq.increaseViewCount();
        return FaqResponse.from(faq);
    }

    @Override
    public List<FaqCategory> getCategories() {
        return Arrays.asList(FaqCategory.values());
    }

    // ===== 관리자 기능 =====

    @Override
    @Transactional
    public FaqResponse createFaq(FaqRequest request) {
        log.info("FAQ 생성: {}", request.getQuestion());
        
        Faq faq = Faq.builder()
                .category(request.getCategory())
                .question(request.getQuestion())
                .answer(request.getAnswer())
                .keywords(request.getKeywords())
                .build();
        
        Faq savedFaq = faqRepository.save(faq);
        return FaqResponse.from(savedFaq);
    }

    @Override
    @Transactional
    public FaqResponse updateFaq(Long id, FaqRequest request) {
        log.info("FAQ 수정: {}", id);
        
        Faq faq = faqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("FAQ를 찾을 수 없습니다. ID: " + id));
        
        faq.update(request.getCategory(), request.getQuestion(), 
                   request.getAnswer(), request.getKeywords());
        
        return FaqResponse.from(faq);
    }

    @Override
    @Transactional
    public void deleteFaq(Long id) {
        log.info("FAQ 삭제: {}", id);
        
        if (!faqRepository.existsById(id)) {
            throw new RuntimeException("FAQ를 찾을 수 없습니다. ID: " + id);
        }
        
        faqRepository.deleteById(id);
    }
}
