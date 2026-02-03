package com.fullStc.news.service;

import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.repository.NewsClusterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageRegenerationService {

    private final NewsClusterRepository newsClusterRepository;
    private final PollinationsImageService pollinationsImageService;

    @Transactional
    public void markFailedAndEnqueue(Long clusterId) {
        NewsCluster c = newsClusterRepository.findById(clusterId).orElse(null);
        if (c == null) return;

        Instant now = Instant.now();

        // 이미 예약된 재시도 시간이 미래면 스팸 방지
        if (c.getImageNextRetryAt() != null && c.getImageNextRetryAt().isAfter(now)) return;

        int nextFail = c.getImageFailCount() + 1;
        c.setImageFailCount(nextFail);
        c.setImageStatus("FAILED");
        c.setImageNextRetryAt(now.plusSeconds(backoffSeconds(nextFail)));

        newsClusterRepository.save(c);

        // 즉시 한 번 비동기 시도
        regenerateAsync(clusterId);
    }

    @Async
    @Transactional
    public void regenerateAsync(Long clusterId) {
        NewsCluster c = newsClusterRepository.findById(clusterId).orElse(null);
        if (c == null) return;

        Instant now = Instant.now();
        if (c.getImageNextRetryAt() != null && c.getImageNextRetryAt().isAfter(now)) return;

        String baseText = (c.getClusterSummary() != null && !c.getClusterSummary().isBlank())
                ? c.getClusterSummary()
                : c.getClusterTitle();

        if (baseText == null || baseText.isBlank()) return;

        try {
            c.setImageStatus("PENDING");
            newsClusterRepository.save(c);

            // ✅ seed는 서비스 내부에서 랜덤 → 새 URL 생성됨
            String newUrl = pollinationsImageService.generateImageUrl(baseText);
            if (newUrl == null || newUrl.isBlank()) throw new RuntimeException("newUrl null");

            c.setImageUrl(newUrl);
            c.setImageStatus("OK");
            c.setImageNextRetryAt(null);
            newsClusterRepository.save(c);

            log.info("🖼️ [REGEN OK] clusterId={} failCount={}", clusterId, c.getImageFailCount());
        } catch (Exception e) {
            int nextFail = c.getImageFailCount() + 1;
            c.setImageFailCount(nextFail);
            c.setImageStatus("FAILED");
            c.setImageNextRetryAt(Instant.now().plusSeconds(backoffSeconds(nextFail)));
            newsClusterRepository.save(c);

            log.warn("🖼️ [REGEN FAIL] clusterId={} nextRetryAt={}", clusterId, c.getImageNextRetryAt());
        }
    }

    // 30초마다 “재시도 시간 지난 FAILED” 다시 시도
    @Scheduled(fixedDelay = 30_000)
    public void retryDue() {
        List<NewsCluster> due = newsClusterRepository.findRetryDue(Instant.now());
        for (NewsCluster c : due) {
            regenerateAsync(c.getId());
        }
    }

    private long backoffSeconds(int failCount) {
        // 1m, 3m, 10m, 30m, 60m...
        return switch (Math.min(failCount, 5)) {
            case 1 -> 60;
            case 2 -> 180;
            case 3 -> 600;
            case 4 -> 1800;
            default -> 3600;
        };
    }
}
