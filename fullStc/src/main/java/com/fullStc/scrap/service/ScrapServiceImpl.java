package com.fullStc.scrap.service;

import com.fullStc.news.domain.NewsCluster;
import com.fullStc.news.repository.NewsClusterRepository;
import com.fullStc.scrap.domain.UserNewsScrap;
import com.fullStc.scrap.dto.ScrapItemDto;
import com.fullStc.scrap.repository.UserNewsScrapRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScrapServiceImpl implements ScrapService {

    private final UserNewsScrapRepository userNewsScrapRepository;
    private final NewsClusterRepository newsClusterRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ScrapItemDto> getScrapItems(Long memberId) {
        return userNewsScrapRepository.findByMemberIdOrderByRegDateDesc(memberId)
                .stream()
                .map(this::toScrapItemDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getScrapNewsIds(Long memberId) {
        return userNewsScrapRepository.findByMemberIdOrderByRegDateDesc(memberId)
                .stream()
                .map(UserNewsScrap::getNewsId)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void toggleScrap(Long memberId, String newsId) {
        Optional<UserNewsScrap> existing = userNewsScrapRepository.findByMemberIdAndNewsId(memberId, newsId);
        if (existing.isPresent()) {
            userNewsScrapRepository.delete(existing.get());
            log.debug("스크랩 해제: memberId={}, newsId={}", memberId, newsId);
            return;
        }

        UserNewsScrap.UserNewsScrapBuilder builder = UserNewsScrap.builder()
                .memberId(memberId)
                .newsId(newsId);

        try {
            Long clusterId = Long.parseLong(newsId);
            Optional<NewsCluster> clusterOpt = newsClusterRepository.findById(clusterId);
            if (clusterOpt.isPresent()) {
                NewsCluster c = clusterOpt.get();
                builder.title(c.getClusterTitle())
                        .summary(c.getClusterSummary())
                        .imageUrl(c.getImageUrl())
                        .url(c.getRepresentativeUrl())
                        .category(c.getCategory());
            }
        } catch (NumberFormatException e) {
            log.warn("newsId를 Long으로 파싱 불가, 스냅샷 없이 저장: newsId={}", newsId);
        }

        userNewsScrapRepository.save(builder.build());
        log.debug("스크랩 추가: memberId={}, newsId={}", memberId, newsId);
    }

    private ScrapItemDto toScrapItemDto(UserNewsScrap s) {
        return ScrapItemDto.builder()
                .sno(s.getId())
                .newsId(s.getNewsId())
                .title(s.getTitle())
                .summary(s.getSummary())
                .imageUrl(s.getImageUrl())
                .url(s.getUrl())
                .category(s.getCategory())
                .scrapedAt(s.getRegDate())
                .build();
    }
}
