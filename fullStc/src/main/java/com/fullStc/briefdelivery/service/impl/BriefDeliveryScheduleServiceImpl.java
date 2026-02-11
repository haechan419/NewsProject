package com.fullStc.briefdelivery.service.impl;

import com.fullStc.briefdelivery.dto.*;
import com.fullStc.briefdelivery.entity.BriefDeliverySchedule;
import com.fullStc.briefdelivery.repository.BriefDeliveryScheduleRepository;
import com.fullStc.briefdelivery.service.BriefDeliveryMailService;
import com.fullStc.briefdelivery.service.BriefDeliveryPdfService;
import com.fullStc.briefdelivery.service.BriefDeliveryScheduleService;
import com.fullStc.member.domain.Member;
import com.fullStc.member.repository.MemberRepository;
import com.fullStc.member.service.CategoryService;
import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.repository.NewsClusterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 브리핑 배송 예약 서비스 구현
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BriefDeliveryScheduleServiceImpl implements BriefDeliveryScheduleService {

    private static final int NEWS_LIMIT = 50;
    /** PDF 1~2장용: 그리드 기사 최대 개수 (리드 1 + 그리드 6 = 7건, 요약은 핵심만 사용) */
    private static final int GRID_MAX_ARTICLES = 6;
    /** 카테고리당 그리드 기사 최대 개수 (정치만 10개 오는 것 방지) */
    private static final int MAX_GRID_PER_CATEGORY = 3;
    /** 0개 선택 시 사용할 기본 카테고리 (news_cluster는 영어 저장: economy, it, politics) */
    private static final List<String> DEFAULT_BRIEF_CATEGORIES = List.of("economy", "it", "politics");
    /** 메인(리드) 기사 선정 시 카테고리 중요도 순서 (앞일수록 우선, news_cluster.category 영어 기준) */
    private static final List<String> LEAD_CATEGORY_PRIORITY = List.of("politics", "economy", "it", "world", "society", "culture");
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_FAILED = "FAILED";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy. MM. dd").withZone(ZoneId.of("Asia/Seoul"));
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("a hh:mm").withZone(ZoneId.of("Asia/Seoul"));

    private final BriefDeliveryScheduleRepository scheduleRepository;
    private final MemberRepository memberRepository;
    private final CategoryService categoryService;
    private final NewsClusterRepository newsClusterRepository;
    private final BriefDeliveryPdfService pdfService;
    private final BriefDeliveryMailService mailService;

    @Override
    @Transactional
    public BriefDeliveryScheduleResponse register(Long userId, BriefDeliveryScheduleRequest request) {
        Instant scheduledAt = request.getScheduledAt();
        if (scheduledAt != null && !scheduledAt.isAfter(Instant.now())) {
            log.warn("Rejecting schedule in the past: userId={}, scheduledAt={}", userId, scheduledAt);
            throw new IllegalArgumentException("과거 시간은 예약할 수 없습니다. 미래 날짜·시간으로 다시 말씀해 주세요.");
        }
        BriefDeliverySchedule schedule = BriefDeliverySchedule.builder()
                .userId(userId)
                .scheduledAt(scheduledAt)
                .status(STATUS_PENDING)
                .build();
        schedule = scheduleRepository.save(schedule);
        log.info("Brief delivery schedule registered: userId={}, scheduledAt={}, id={}", userId, request.getScheduledAt(), schedule.getId());
        return toResponse(schedule);
    }

    @Override
    @Transactional
    public void processDueSchedules() {
        List<BriefDeliverySchedule> due = scheduleRepository.findByStatusAndScheduledAtBeforeOrderByScheduledAtAsc(STATUS_PENDING, Instant.now());
        if (due.isEmpty()) {
            return;
        }
        log.info("Brief delivery due schedules: count={}", due.size());
        for (BriefDeliverySchedule schedule : due) {
            try {
                runOne(schedule);
            } catch (Exception e) {
                log.error("Brief delivery run failed: scheduleId={}", schedule.getId(), e);
                schedule.setStatus(STATUS_FAILED);
                schedule.setErrorMessage(rootMessage(e));
                scheduleRepository.save(schedule);
            }
        }
    }

    private void runOne(BriefDeliverySchedule schedule) {
        schedule.setLastAttemptAt(Instant.now());
        schedule.setErrorMessage(null);
        scheduleRepository.save(schedule);

        Long userId = schedule.getUserId();
        Member member = memberRepository.findById(userId).orElse(null);
        if (member == null) {
            log.warn("Member not found: userId={}", userId);
            schedule.setStatus(STATUS_FAILED);
            schedule.setErrorMessage("Member not found");
            scheduleRepository.save(schedule);
            return;
        }
        List<String> categories = categoryService.getUserCategories(userId);
        if (categories == null || categories.isEmpty()) {
            categories = new ArrayList<>(DEFAULT_BRIEF_CATEGORIES);
        }
        List<NewsCluster> clusters = newsClusterRepository.findByCategoriesOrderByUpdatedAtDesc(categories, NEWS_LIMIT);
        if (clusters.isEmpty()) {
            log.warn("No news clusters available: userId={}", userId);
            schedule.setStatus(STATUS_FAILED);
            schedule.setErrorMessage("No news clusters available");
            scheduleRepository.save(schedule);
            return;
        }
        // 리드 1건: 카테고리 중요도 순 → 해당 카테고리 내 최신순(updated_at DESC)
        Map<String, List<NewsCluster>> byCategory = clusters.stream()
                .collect(Collectors.groupingBy(c -> c.getCategory() != null && !c.getCategory().isBlank() ? c.getCategory() : "culture"));
        NewsCluster leadCluster = null;
        for (String cat : LEAD_CATEGORY_PRIORITY) {
            List<NewsCluster> list = byCategory.get(cat);
            if (list != null && !list.isEmpty()) {
                leadCluster = list.stream()
                        .max(Comparator.comparing(NewsCluster::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                        .orElse(list.get(0));
                break;
            }
        }
        if (leadCluster == null) {
            leadCluster = clusters.stream()
                    .max(Comparator.comparing(NewsCluster::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                    .orElse(clusters.get(0));
        }
        final NewsCluster lead = leadCluster;
        List<NewsCluster> sortedGrid = clusters.stream()
                .filter(c -> !c.getId().equals(lead.getId()))
                .sorted(Comparator
                        .comparingInt((NewsCluster c) -> {
                            String cat = c.getCategory() != null ? c.getCategory() : "";
                            int idx = LEAD_CATEGORY_PRIORITY.indexOf(cat);
                            return idx < 0 ? LEAD_CATEGORY_PRIORITY.size() : idx;
                        })
                        .thenComparing(NewsCluster::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        Map<String, List<NewsCluster>> gridByCat = sortedGrid.stream()
                .collect(Collectors.groupingBy(c -> c.getCategory() != null && !c.getCategory().isBlank() ? c.getCategory() : "culture"));
        List<NewsCluster> gridClusters = new ArrayList<>();
        Set<Long> addedIds = new HashSet<>();
        for (String cat : LEAD_CATEGORY_PRIORITY) {
            List<NewsCluster> list = gridByCat.get(cat);
            if (list != null && !list.isEmpty() && gridClusters.size() < GRID_MAX_ARTICLES) {
                int take = Math.min(MAX_GRID_PER_CATEGORY, GRID_MAX_ARTICLES - gridClusters.size());
                for (NewsCluster c : list) {
                    if (take <= 0 || gridClusters.size() >= GRID_MAX_ARTICLES) break;
                    if (addedIds.add(c.getId())) {
                        gridClusters.add(c);
                        take--;
                    }
                }
            }
        }
        for (NewsCluster c : sortedGrid) {
            if (gridClusters.size() >= GRID_MAX_ARTICLES) break;
            if (addedIds.add(c.getId())) gridClusters.add(c);
        }

        BriefDeliveryPdfArticleDto leadDto = toPdfArticle(leadCluster);
        List<BriefDeliveryPdfArticleDto> gridDtos = gridClusters.stream().map(BriefDeliveryScheduleServiceImpl::toPdfArticle).collect(Collectors.toList());

        String publishDate = DATE_FORMAT.format(Instant.now());
        String scheduledTimeLog = "Scheduled at: " + TIME_FORMAT.format(schedule.getScheduledAt()) + ", processed at: " + Instant.now();

        BriefDeliveryPdfRequestDto pdfRequest = BriefDeliveryPdfRequestDto.builder()
                .userName(member.getNickname() != null ? member.getNickname() : "고객")
                .userEmail(member.getEmail())
                .publishDate(publishDate)
                .scheduledTimeLog(scheduledTimeLog)
                .leadArticle(leadDto)
                .gridArticles(gridDtos)
                .build();

        byte[] pdfBytes = pdfService.generatePdf(pdfRequest);
        if (pdfBytes == null || pdfBytes.length == 0) {
            log.error("PDF generation failed: scheduleId={}", schedule.getId());
            schedule.setStatus(STATUS_FAILED);
            schedule.setErrorMessage("PDF generation returned empty bytes");
            scheduleRepository.save(schedule);
            return;
        }
        String fileName = "NewsPulse_Brief_" + DateTimeFormatter.ofPattern("yyyyMMdd_HHmm").withZone(ZoneId.of("Asia/Seoul")).format(Instant.now()) + ".pdf";
        try {
            mailService.sendPdfMail(member.getEmail(), member.getNickname(), "[NewsPulse] 뉴스펄스 맞춤 브리핑", pdfBytes, fileName);
            schedule.setStatus(STATUS_COMPLETED);
            schedule.setCompletedAt(Instant.now());
            schedule.setErrorMessage(null);
            scheduleRepository.save(schedule);
            log.info("Brief delivery completed: scheduleId={}, userId={}", schedule.getId(), userId);
        } catch (Exception e) {
            schedule.setStatus(STATUS_FAILED);
            schedule.setErrorMessage(rootMessage(e));
            scheduleRepository.save(schedule);
            throw e;
        }
    }

    private static String rootMessage(Throwable t) {
        if (t == null) return null;
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        String msg = cur.getMessage();
        return (msg == null || msg.isBlank()) ? t.toString() : msg;
    }

    private static BriefDeliveryPdfArticleDto toPdfArticle(NewsCluster c) {
        return BriefDeliveryPdfArticleDto.builder()
                .id(c.getId())
                .title(c.getClusterTitle())
                .summary(c.getClusterSummary())
                .originalUrl(c.getRepresentativeUrl())
                .category(c.getCategory())
                .image(c.getImageUrl())
                .date(c.getCreatedAt() != null ? c.getCreatedAt().toString() : "")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BriefDeliveryScheduleResponse> findByUserId(Long userId) {
        return scheduleRepository.findByUserIdOrderByScheduledAtDesc(userId).stream()
                .map(BriefDeliveryScheduleServiceImpl::toResponse)
                .collect(Collectors.toList());
    }

    private static BriefDeliveryScheduleResponse toResponse(BriefDeliverySchedule s) {
        return BriefDeliveryScheduleResponse.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .scheduledAt(s.getScheduledAt())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
