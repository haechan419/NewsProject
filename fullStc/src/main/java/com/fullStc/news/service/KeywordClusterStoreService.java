package com.fullStc.news.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import com.fullStc.news.domain.News;
import com.fullStc.news.repository.NewsRepository;

@Service
@RequiredArgsConstructor
public class KeywordClusterStoreService {

    private final NewsRepository newsRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveDupClusterId(Long newsId, Long clusterId) {
        News n = newsRepository.findById(newsId).orElseThrow();
        n.setDupClusterId(clusterId);
        // save 안 해도 dirty-check로 반영됨. (원하면 save(n) 추가해도 됨)
    }
}
