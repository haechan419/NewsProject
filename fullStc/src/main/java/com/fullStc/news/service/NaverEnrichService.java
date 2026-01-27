package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.fullStc.news.domain.News;
import com.fullStc.news.extract.ExtractorRegistry;
import com.fullStc.news.repository.NewsRepository;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NaverEnrichService {

    private final NewsRepository newsRepository;
    private final ExtractorRegistry registry;
    private final NewsEnrichStoreService enrichStore;

    // ★ 여기에 @Transactional 있으면 절대 안됨! (있으면 삭제)
    public EnrichResult enrich(int limit) {

        int contentOk = 0;
        int tried = 0;
        int failed = 0;
        Instant now = Instant.now();

        // 아까 수정한 limit만 받는 메소드 호출
        var targets = newsRepository.findNaverWithoutContent(limit);

        for (News n : targets) {
            tried++;
            enrichStore.markAttempt(n.getId(), now);

            try {
                // 네이버 URL 그대로 사용
                String targetUrl = n.getUrl();
                var r = registry.extract(targetUrl);

                int len = (r == null || r.content() == null) ? 0 : r.content().trim().length();
                boolean ok = (r != null && r.ok() && len > 50);

                if (!ok) {
                    failed++;
                    log.warn("[ENRICH FAIL] Short/Empty. ID={} URL={}", n.getId(), targetUrl);
                    continue;
                }

                // ★ [중요] 객체(n)를 수정하지 말고, ID와 내용만 넘기세요!
                // n.setContent(r.content()); // <--- 이거 하지 마세요 (Hibernate가 감지함)

                enrichStore.saveContent(n.getId(), r.content(), now);
                contentOk++;
                log.info("[ENRICH OK] ID={}", n.getId());

            } catch (Exception e) {
                failed++;
                log.error("[ENRICH ERROR] ID={} Msg={}", n.getId(), e.getMessage());
            }
        }
        return new EnrichResult(contentOk, tried, failed);
    }

    // NaverEnrichService.java 내부

    /**
     * 특정 ID 리스트에 대해 강제 Enrich 수행 (크롤링 직후 호출용)
     */
    public EnrichResult enrichForIds(List<Long> ids, int limit) {

        // 1. 방어 로직: ID 없으면 바로 종료 (안 하면 에러 남)
        if (ids == null || ids.isEmpty()) return new EnrichResult(0, 0, 0);

        int contentOk = 0;
        int tried = 0;
        int failed = 0;

        Instant now = Instant.now();

        // 2. ID로 조회
        var targets = newsRepository.findByIdIn(ids);

        for (News n : targets) {
            tried++;
            // 마킹
            enrichStore.markAttempt(n.getId(), now);

            try {
                // 3. 네이버 URL 그대로 사용
                String targetUrl = n.getUrl();
                var r = registry.extract(targetUrl);

                // 4. 검증
                int len = (r == null || r.content() == null) ? 0 : r.content().trim().length();
                boolean ok = (r != null && r.ok() && len > 50);

                if (!ok) {
                    failed++;
                    log.warn("[ENRICH-ID FAIL] Short/Empty. ID={} URL={}", n.getId(), targetUrl);
                    continue;
                }

                // ★ [핵심 수정] 여기서도 n.setContent() 쓰면 안됨! JDBC Store 사용!
                // n.setContent(r.content()); // <--- ❌ 이거 절대 금지 (삭제)

                enrichStore.saveContent(n.getId(), r.content(), now); // ✅ JDBC로 저장
                contentOk++;
                log.info("[ENRICH-ID OK] ID={}", n.getId());

            } catch (Exception e) {
                failed++;
                log.error("[ENRICH-ID ERROR] ID={} Msg={}", n.getId(), e.getMessage());
            }
        }

        return new EnrichResult(contentOk, tried, failed);
    }

    public record EnrichResult(int contentFilled, int tried, int failed) {}
}